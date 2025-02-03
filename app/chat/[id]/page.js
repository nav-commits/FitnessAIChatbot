"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Bot, Menu, Sun, Moon, LogOut } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SidebarContent from "@/components/SidebarContent";
import { useTheme } from "next-themes";
import { signOut, signIn, useSession } from "next-auth/react";

export default function Chat({ params }) {
  const { id } = params;
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const { setTheme } = useTheme();
  const { data: session, status } = useSession();

  
  useEffect(() => {
    async function fetchMessages() {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/chat/${id}`, {
          headers: {
            Authorization: `Bearer ${session?.user?.token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data.messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
      setIsLoading(false);
    }

    if (session) fetchMessages();
  }, [id, session]);

    // If still loading, show nothing
    if (status === "loading") {
      return <p className="text-center mt-20">Loading...</p>;
    }
  
    // Redirect to login if not authenticated
    if (!session) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              Welcome to Fitness AI Assistant
            </h1>
            <Button onClick={() => signIn("google")}>Sign in with Google</Button>
          </div>
        </div>
      );
    }
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { content: input, role: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token}`,
        },
        body: JSON.stringify({ input: input.trim(), id: id }),
      });

      const data = await response.json();
      const botMessage = { content: data.response, role: "assistant" };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:flex flex-col bg-muted/50 border-r">
        <SidebarContent />
      </div>
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center space-x-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              <Bot className="w-8 h-8 text-primary" />
              <Link href="/">
                <h1 className="text-xl font-semibold">Fitness AI Assistant</h1>
              </Link>
            </div>

            {/* Flex container for Theme Toggle and other buttons */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Sun className="h-5 w-5 rotate-0 transition-all dark:-rotate-90" />
                    <Moon className="absolute h-5 w-5 rotate-90 transition-all dark:rotate-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* You can add other buttons here, like a sign out button */}
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Start a conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start space-x-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <Bot className="w-8 h-8 text-primary" />
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isLoading && <div className="text-center">Loading...</div>}
          </div>
        </div>
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-6"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
