"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Plus, Trash2, Edit, Menu, Copy, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { handleAIcommunication } from "@/lib/agent/flight-planner";
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
}

const Index = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);
  //eslint-disable-next-line
  const messages = currentChat?.messages || [];

  useEffect(() => {
    const savedChats = localStorage.getItem('chats');
    const initialChats = savedChats 
      ? JSON.parse(savedChats) 
      : [{
          id: Date.now().toString(),
          name: "New Chat",
          messages: [],
          createdAt: new Date()
        }];
    
    setChats(initialChats);
    setCurrentChatId(initialChats[0]?.id || '');
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('chats', JSON.stringify(chats));
    }
  }, [chats, isInitialized]);

  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingChatId]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      name: "New Chat",
      messages: [],
      createdAt: new Date()
    };
    setChats(prev => [...prev, newChat]);
    setCurrentChatId(newChat.id);
    toast.success("New chat created");
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        createNewChat();
      }
    }
    toast.success("Chat deleted");
  };

  const startEditingChat = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditingName(chat.name);
  };

  const saveEditingChat = () => {
    if (!editingName.trim()) {
      toast.error("Chat name cannot be empty");
      return;
    }

    setChats(prev => prev.map(chat => {
      if (chat.id === editingChatId) {
        return { ...chat, name: editingName.trim() };
      }
      return chat;
    }));
    setEditingChatId(null);
    setEditingName("");
    toast.success("Chat renamed");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveEditingChat();
    } else if (e.key === "Escape") {
      setEditingChatId(null);
      setEditingName("");
    }
  };

  const convertToChatCompletionMessages = (messages: Message[]) => {
    return messages.map(message => ({
      role: message.role,
      content: message.content
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    let updatedChat: Chat | undefined;
    setChats(prev => {
      const newChats = prev.map(chat => {
        if (chat.id === currentChatId) {
          const shouldUpdateName = chat.name === "New Chat" && chat.messages.length === 0;
          const updatedChatItem = {
            ...chat,
            name: shouldUpdateName ? userMessage.content.slice(0, 30) : chat.name,
            messages: [...chat.messages, userMessage]
          };
          updatedChat = updatedChatItem;
          return updatedChatItem;
        }
        return chat;
      });
      return newChats;
    });
    
    setInput("");
    setIsLoading(true);

    try {
      const previousMessages = updatedChat?.messages.slice(0, -1) || [];
      const previousConversation = convertToChatCompletionMessages(previousMessages);
      
      const response = await handleAIcommunication(userMessage.content, previousConversation);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: response.content || "AI failed to generate a response",
        role: 'assistant',
        timestamp: new Date(),
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, assistantMessage]
          };
        }
        return chat;
      }));
    } catch (error) {
      toast.error("Failed to get response from AI");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy text", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const downloadAsTextFile = (text: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-current animate-pulse animation-delay-200" />
          <div className="w-2 h-2 rounded-full bg-current animate-pulse animation-delay-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto">
          <div className="h-14 flex items-center px-4">
            <Button
              variant="ghost"
              size="icon"
              className="mr-4"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <span className="font-semibold">AI Flight Assistant</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-6xl mx-auto w-full overflow-hidden">
        <div
          className={cn(
            "border-r bg-muted/10 transition-all duration-300 ease-in-out flex flex-col h-[calc(100vh-3.5rem)]",
            isSidebarOpen ? "w-64" : "w-0 opacity-0 overflow-hidden"
          )}
        >
          <div className="p-4">
            <Button onClick={createNewChat} className="w-full flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1 px-4 pb-4">
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent cursor-pointer",
                    chat.id === currentChatId ? "bg-accent" : ""
                  )}
                  onClick={() => setCurrentChatId(chat.id)}
                >
                  {editingChatId === chat.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={saveEditingChat}
                      className="flex-1 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-ring rounded px-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate max-w-[140px]">
                      {chat.name}
                    </span>
                  )}
                  <div className="flex gap-1 shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingChat(chat);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-4 fade-in",
                    message.role === "assistant" ? "flex-row" : "flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg p-4 max-w-[80%] shadow-sm relative group",
                      message.role === "assistant"
                        ? "bg-background border"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    <span className="text-xs opacity-50 mt-2 block">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(message.content)}
                            >
                              <Copy className="h-3 w-3" />
                              <span className="sr-only">Copy text</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy to clipboard</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => 
                                downloadAsTextFile(
                                  message.content, 
                                  `message-${new Date(message.timestamp).toISOString().split('T')[0]}.txt`
                                )
                              }
                            >
                              <Download className="h-3 w-3" />
                              <span className="sr-only">Download as text</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download as text</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-current" />
                  <div className="w-2 h-2 rounded-full bg-current animation-delay-200" />
                  <div className="w-2 h-2 rounded-full bg-current animation-delay-400" />
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <form
            onSubmit={handleSubmit}
            className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4"
          >
            <div className="relative flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="min-h-[60px] w-full resize-none rounded-lg pr-12"
                rows={1}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className={cn(
                  "absolute right-2 bottom-2 h-8 w-8",
                  input.trim() ? "opacity-100" : "opacity-0 transition-opacity"
                )}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Index;
