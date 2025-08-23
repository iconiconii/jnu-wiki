'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fuzzyMatch } from '@/lib/fuzzy-match';
import authConfig from '@/config/auth-config.json';

interface Question {
  id: string;
  type: 'text' | 'image';
  question: string;
  questionText?: string;
  answers: string[];
  hints?: string[];
  errorMessages?: string[];
}

interface AuthConfig {
  maxAttempts: number;
  showHints: boolean;
  randomizeQuestions: boolean;
}

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess: () => void;
  onAuthFailed?: () => void;
  allowClose?: boolean; // 是否允许关闭对话框
}

export function AuthDialog({ isOpen, onOpenChange, onAuthSuccess, onAuthFailed, allowClose = true }: AuthDialogProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  
  const config = (authConfig as any).config as AuthConfig;
  const maxAttempts = config?.maxAttempts || 3;

  // 随机选择一个问题
  useEffect(() => {
    if (isOpen && !currentQuestion) {
      const questions = authConfig.questions as Question[];
      const randomIndex = Math.floor(Math.random() * questions.length);
      setCurrentQuestion(questions[randomIndex]);
      setUserAnswer('');
      setError('');
      setAttempts(0);
      setShowHint(false);
    }
  }, [isOpen, currentQuestion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentQuestion || !userAnswer.trim()) {
      setError('请输入答案');
      return;
    }

    setIsLoading(true);
    setError('');

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    const isCorrect = fuzzyMatch(userAnswer, currentQuestion.answers);
    
    if (isCorrect) {
      setIsLoading(false);
      onAuthSuccess();
      onOpenChange(false);
      // 重置状态
      setCurrentQuestion(null);
      setUserAnswer('');
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= maxAttempts) {
        setError(`验证失败，已达到最大尝试次数 (${maxAttempts})`);
        setIsLoading(false);
        if (onAuthFailed) {
          onAuthFailed();
        }
        // 延迟关闭对话框
        setTimeout(() => {
          onOpenChange(false);
          setCurrentQuestion(null);
          setUserAnswer('');
          setAttempts(0);
          setError('');
          setShowHint(false);
        }, 2000);
      } else {
        // 使用配置文件中的自定义错误提示
        let errorMessage = `答案不正确，还有 ${maxAttempts - newAttempts} 次机会`;
        
        if (currentQuestion.errorMessages && currentQuestion.errorMessages.length > 0) {
          const errorIndex = Math.min(newAttempts - 1, currentQuestion.errorMessages.length - 1);
          errorMessage = currentQuestion.errorMessages[errorIndex];
          if (maxAttempts - newAttempts > 0) {
            errorMessage += ` (还有 ${maxAttempts - newAttempts} 次机会)`;
          }
        }
        
        setError(errorMessage);
        setUserAnswer('');
        setIsLoading(false);
        
        // 显示提示（如果配置允许且存在提示）
        if (config?.showHints && currentQuestion.hints && currentQuestion.hints.length > 0 && newAttempts >= 1) {
          setShowHint(true);
        }
      }
    }
  };

  const handleClose = () => {
    if (!allowClose) return; // 不允许关闭时直接返回
    
    onOpenChange(false);
    setCurrentQuestion(null);
    setUserAnswer('');
    setError('');
    setAttempts(0);
    setShowHint(false);
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={allowClose ? handleClose : undefined}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => !allowClose && e.preventDefault()} onEscapeKeyDown={(e) => !allowClose && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>安全验证</DialogTitle>
          <DialogDescription>
            请完成以下验证以继续访问
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">验证问题</Label>
            <div className="p-3 bg-muted rounded-md">
              {currentQuestion.type === 'image' ? (
                <div className="space-y-2">
                  <img 
                    src={currentQuestion.question} 
                    alt="验证图片" 
                    className="max-w-full h-auto rounded border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+aXoOazleWKoOi9vTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                  {currentQuestion.questionText && (
                    <p className="text-sm text-muted-foreground">
                      {currentQuestion.questionText}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm">{currentQuestion.question}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">您的答案</Label>
            <Input
              id="answer"
              type="text"
              placeholder="请输入答案"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
              {error}
            </div>
          )}

          {showHint && currentQuestion.hints && currentQuestion.hints.length > 0 && (
            <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
              <div className="font-medium mb-1">💡 小贴士：</div>
              {currentQuestion.hints.map((hint, index) => (
                <div key={index} className="mb-1 last:mb-0">
                  {hint}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            {allowClose && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isLoading}
              >
                取消
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isLoading || !userAnswer.trim()}
            >
              {isLoading ? '验证中...' : '提交'}
            </Button>
          </DialogFooter>
        </form>

        <div className="text-xs text-muted-foreground text-center">
          尝试次数: {attempts}/{maxAttempts}
        </div>
      </DialogContent>
    </Dialog>
  );
}