"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { ScrollArea } from "./components/ui/scroll-area"
import {
  Bot,
  User,
  Send,
  Loader2,
  X,
  FileText,
  Search,
  Minimize2,
  Maximize2,
} from "lucide-react"

interface Message {
  id: number
  type: "user" | "bot"
  content: string
  timestamp: Date
  isLoading?: boolean
}

interface RAGResponse {
  question: string
  answer: string
  sources: string[]
  confidence: number
}

const RAGChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "bot",
      content: "👋 **Welcome to MediaNet AI Assistant!**\n\nAsk me anything about our platform, features, or documentation.",
      timestamp: new Date(),
    },
  ])

  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatMessageContent = (content: string): string => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/•/g, '<span style="color: #10b981;">•</span>')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Add loading message
    const loadingMessage: Message = {
      id: messages.length + 2,
      type: "bot",
      content: "Searching knowledge base... 🔍",
      timestamp: new Date(),
      isLoading: true,
    }

    setMessages((prev) => [...prev, loadingMessage])

    try {
      const response = await fetch("http://localhost:8000/rag/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: userMessage.content }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: RAGResponse = await response.json()

      // Clean response - only show the answer
      let responseContent = data.answer

      const botResponse: Message = {
        id: messages.length + 3,
        type: "bot",
        content: responseContent,
        timestamp: new Date(),
      }

      setMessages((prev) => prev.slice(0, -1).concat([botResponse]))
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 3,
        type: "bot",
        content: `❌ **Sorry, I encountered an error:**\n\n${error instanceof Error ? error.message : "Unknown error"}\n\nPlease try again or check if the backend service is running.`,
        timestamp: new Date(),
      }

      setMessages((prev) => prev.slice(0, -1).concat([errorMessage]))
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: "bot",
        content: "👋 **Chat cleared!** How can I help you?",
        timestamp: new Date(),
      },
    ])
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-16 w-16 shadow-lg hover:shadow-2xl transition-all duration-200 bg-accent hover:bg-accent/90 border-2 border-background"
        >
          <div className="flex flex-col items-center">
            <Bot className="h-6 w-6 text-accent-foreground" />
            <span className="text-xs text-accent-foreground mt-0.5 font-medium">AI</span>
          </div>
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-[420px] h-[650px]'
    }`}>
      <Card className="h-full bg-background/95 backdrop-blur-sm border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-accent">
              <Bot className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">Ask anything</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 p-3">
              <ScrollArea className="h-[475px]">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="space-y-2">
                      <Card
                        className={`${
                          message.type === "user"
                            ? "ml-8 bg-accent text-accent-foreground"
                            : "mr-8 bg-muted"
                        }`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <div
                              className={`p-1.5 rounded-full ${
                                message.type === "user" 
                                  ? "bg-accent-foreground/20" 
                                  : "bg-muted-foreground/20"
                              }`}
                            >
                              {message.type === "user" ? (
                                <User className="h-3 w-3" />
                              ) : (
                                <Bot className="h-3 w-3" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div
                                className="text-sm leading-relaxed break-words"
                                dangerouslySetInnerHTML={{
                                  __html: formatMessageContent(message.content),
                                }}
                              />

                              <div className="text-xs mt-1 opacity-70">
                                {message.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              
                              {message.isLoading && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span className="text-xs">Searching...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1 text-sm"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={isLoading || !inputValue.trim()}
                  className="px-3"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              
              {/* Quick actions */}
              <div className="flex gap-1 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue("How do I get started with MediaNet?")}
                  className="text-xs h-6 px-2"
                  disabled={isLoading}
                >
                  <Search className="h-3 w-3 mr-1" />
                  Getting Started
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue("Show me key features")}
                  className="text-xs h-6 px-2"
                  disabled={isLoading}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Features
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default RAGChatBot