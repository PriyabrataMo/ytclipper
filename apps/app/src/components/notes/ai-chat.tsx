import { useAnswerQuestionMutation } from '@/services/timestamps';
import { useAppSelector } from '@/store/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@ytclipper/ui';
import { Bot, Check, Copy, Send, Sparkles, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  relatedTimestamp?: number;
}

interface AIChatProps {
  videoId: string;
  currentTimestamp?: number;
}

export const AIChat = ({ videoId, currentTimestamp }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content:
        "Hi! I'm here to help you understand this video better. You can ask me questions about any part of the video, and I'll provide detailed explanations based on your notes.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const timeStampsSliceData = useAppSelector((state) => state.timestamps);
  const videoTitle = timeStampsSliceData.videoTitle;
  currentTimestamp = timeStampsSliceData.currentTimestamp;
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [answerQuestion, { isLoading: isAnswering }] =
    useAnswerQuestionMutation();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    setShowSuggestions(false);

    if (!inputValue.trim()) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      relatedTimestamp: currentTimestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    const question = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await answerQuestion({
        question: question.trim(),
        video_id: videoId,
        context: 5,
      }).unwrap();

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.data.answer,
        timestamp: new Date(),
        relatedTimestamp: currentTimestamp,
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Failed to answer question:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content:
          'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date(),
        relatedTimestamp: currentTimestamp,
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleSuggestionClick = (question: string) => {
    setInputValue(question);
  };

  const Suggestions = useMemo(() => {
    if (!showSuggestions) {
      return null;
    }

    const suggestedQuestions = [
      'Summarize the main points',
      'What are the key takeaways?',
      'Explain this concept in simple terms',
      'What examples were given?',
      'How does this relate to...?',
    ];

    return (
      <div className='mt-2'>
        <div className='text-xs text-muted-foreground mb-2'>
          Suggested questions:
        </div>
        <div className='flex flex-wrap gap-1'>
          {suggestedQuestions.map((question) => (
            <Button
              key={question}
              variant='outline'
              size='sm'
              className='text-xs h-7'
              onClick={() => handleSuggestionClick(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    );
  }, [showSuggestions]);

  return (
    <Card className='h-full flex flex-col pt-4 gap-4'>
      <CardHeader className=''>
        <CardTitle className='flex items-center gap-2 text-lg p-0'>
          <Bot className='h-5 w-5 text-accent' />
          AI Assistant
          <Sparkles className='h-4 w-4 text-accent' />
        </CardTitle>
        {videoTitle ? (
          <p className='text-sm text-muted-foreground'>
            Chatting about: {videoTitle}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className='flex-1 flex flex-col p-0 justify-between'>
        {/* Messages */}
        <div className='flex-1 px-4 max-h-[55vh] overflow-y-auto'>
          <div className='space-y-4 pb-4'>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-accent-foreground'
                    }`}
                  >
                    {message.type === 'user' ? (
                      <User className='h-4 w-4' />
                    ) : (
                      <Bot className='h-4 w-4' />
                    )}
                  </div>

                  <div
                    className={`rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className='text-sm whitespace-pre-wrap'>
                      {message.content}
                    </div>
                    {message.relatedTimestamp !== undefined && (
                      <Badge variant='outline' className='mt-2 text-xs'>
                        At {formatTime(message.relatedTimestamp)}
                      </Badge>
                    )}
                    {message.type === 'ai' && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='mt-2 h-6 px-2'
                        onClick={() => copyToClipboard(message.content)}
                      >
                        {copied ? (
                          <Check className='h-3 w-3 text-green-600' />
                        ) : (
                          <Copy className='h-3 w-3' />
                        )}
                      </Button>
                    )}
                  </div>

                  <div ref={bottomRef} />
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className='flex gap-3 justify-start'>
                <div className='w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center'>
                  <Bot className='h-4 w-4' />
                </div>
                <div className='bg-muted rounded-lg p-3'>
                  <div className='flex gap-1'>
                    <div className='w-2 h-2 bg-current rounded-full animate-bounce' />
                    <div
                      className='w-2 h-2 bg-current rounded-full animate-bounce'
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className='w-2 h-2 bg-current rounded-full animate-bounce'
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className='px-4 py-3 border-t'>
            <div className='flex gap-2 mb-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowSuggestions((prev) => !prev)}
                className='text-xs h-7'
              >
                {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
              </Button>
            </div>

            {Suggestions}
          </div>

          {/* Input */}
          <div className='p-4 border-t'>
            <div className='flex gap-2'>
              <Input
                placeholder={`Ask about the video${currentTimestamp ? ` at ${formatTime(currentTimestamp)}` : ''}...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' && !e.shiftKey && handleSendMessage()
                }
                disabled={isLoading || isAnswering}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || isAnswering}
                size='icon'
              >
                <Send className='h-4 w-4' />
              </Button>
            </div>
            {currentTimestamp !== undefined && (
              <div className='mt-2 text-xs text-muted-foreground'>
                Current timestamp: {formatTime(currentTimestamp)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
