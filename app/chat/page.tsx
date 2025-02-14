"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Plus, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

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
  const [chats, setChats] = useState<Chat[]>(() => {
    if (typeof window !== 'undefined') {
      const savedChats = localStorage.getItem('chats');
      return savedChats ? JSON.parse(savedChats) : [{
        id: Date.now().toString(),
        name: "New Chat",
        messages: [],
        createdAt: new Date()
      }];
    }
    return [{
      id: Date.now().toString(),
      name: "New Chat",
      messages: [],
      createdAt: new Date()
    }];
  });
  const [currentChatId, setCurrentChatId] = useState<string>(() => {
    return chats[0]?.id || '';
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chats', JSON.stringify(chats));
    }
  }, [chats]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        // Update chat name if it's the first message and still default
        const shouldUpdateName = chat.name === "New Chat" && chat.messages.length === 0;
        return {
          ...chat,
          name: shouldUpdateName ? userMessage.content.slice(0, 30) : chat.name,
          messages: [...chat.messages, userMessage]
        };
      }
      return chat;
    }));
    
    setInput("");
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "This is a simulated response. Replace this with actual API integration.",
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
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto">
          <div className="h-14 flex items-center px-4 font-semibold">
            AI Flight Assistant
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-6xl mx-auto w-full">
        {/* Chat List Sidebar */}
        <div className="w-64 border-r bg-muted/10 p-4 flex flex-col gap-2">
          <Button onClick={createNewChat} className="w-full flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
          <ScrollArea className="flex-1">
            <div className="space-y-2 mt-4">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent cursor-pointer",
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
                    <span className="flex-1 truncate">
                      {chat.name}
                    </span>
                  )}
                  <div className="flex gap-1">
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

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4 space-y-4">
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
                      "rounded-lg p-4 max-w-[80%] shadow-sm",
                      message.role === "assistant"
                        ? "bg-background border"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-50 mt-2 block">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
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