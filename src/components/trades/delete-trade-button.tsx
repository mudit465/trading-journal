"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteTrade } from "@/lib/actions/trades";
import { useToast } from "@/hooks/use-toast";

type DeleteTradeButtonProps = {
  tradeId: string;
  date: string;
};

export function DeleteTradeButton({ tradeId, date }: DeleteTradeButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTrade(tradeId);
        toast({ title: "Trade deleted" });
        router.push(`/journal/${date}`);
      } catch {
        toast({ title: "Failed to delete trade", variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete trade?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The trade and all its data will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete trade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
