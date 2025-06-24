
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";

export default function DataTransferDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const { transferAnonymousData } = useTasks();

  useEffect(() => {
    const handleShowDialog = () => {
      setIsOpen(true);
    };

    window.addEventListener('show-data-transfer-dialog', handleShowDialog);
    return () => window.removeEventListener('show-data-transfer-dialog', handleShowDialog);
  }, []);

  const handleTransfer = async () => {
    setIsTransferring(true);
    try {
      const result = await transferAnonymousData.mutateAsync();
      console.log(`Successfully transferred ${result.transferred} tasks`);
      setIsOpen(false);
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleSkip = () => {
    // Clear anonymous tasks without transferring
    localStorage.removeItem('anonymous_tasks');
    setIsOpen(false);
  };

  const anonymousTaskCount = () => {
    try {
      const tasks = localStorage.getItem('anonymous_tasks');
      return tasks ? JSON.parse(tasks).length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Your Tasks?</DialogTitle>
          <DialogDescription>
            You have {anonymousTaskCount()} task{anonymousTaskCount() !== 1 ? 's' : ''} created while browsing anonymously. 
            Would you like to transfer them to your account?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex space-x-3 mt-6">
          <Button 
            onClick={handleSkip} 
            variant="outline" 
            className="flex-1"
            disabled={isTransferring}
          >
            Skip
          </Button>
          <Button 
            onClick={handleTransfer} 
            className="flex-1"
            disabled={isTransferring}
          >
            {isTransferring ? 'Transferring...' : 'Transfer Tasks'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
