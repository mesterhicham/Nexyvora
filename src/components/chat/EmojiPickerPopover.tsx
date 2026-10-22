import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Smile, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface EmojiPickerPopoverProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Top',
    label: 'شائع / Popular',
    emojis: ['❤️', '🔥', '👍', '👏', '😂', '😍', '🙌', '🎉', '💯', '✨', '🙏', '😊', '🤩', '💪', '🚀', '⭐'],
  },
  {
    name: 'Faces',
    label: 'وجوه ومشاعر / Faces',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇',
      '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑',
      '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
      '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟',
      '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢',
      '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠',
    ],
  },
  {
    name: 'Hands',
    label: 'إيماءات وأيدي / Gestures',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
      '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜',
      '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '👂', '👃', '👀',
    ],
  },
  {
    name: 'Hearts',
    label: 'قلوب وحب / Hearts',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
      '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌', '💐', '🌹', '🥀', '🌺',
    ],
  },
  {
    name: 'Celebration',
    label: 'احتفال ورموز / Celebration',
    emojis: [
      '🔥', '✨', '🌟', '💫', '💥', '💯', '💢', '🎉', '🎊', '🎁', '🏆', '🥇',
      '🥈', '🥉', '👑', '💎', '💡', '📌', '🚀', '⚡', '🎯', '📚', '🎓', '💻',
      '📱', '💵', '💰', '💳', '🔔', '📢', '✅', '❌', '⚠️', '⭐', '🌈', '☕',
    ],
  },
];

export function EmojiPickerPopover({ onEmojiSelect, disabled }: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);

  const filteredEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(emoji => emoji.includes(search.trim()))
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
          title="إضافة إيموجي / Insert Emoji"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-80 p-3 rounded-2xl shadow-xl border bg-popover/95 backdrop-blur-md z-50"
      >
        <div className="space-y-2.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-border/50">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => {
                  setActiveCategory(idx);
                  setSearch('');
                }}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors shrink-0 font-medium ${
                  activeCategory === idx && !search
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="max-h-56 overflow-y-auto pr-1">
            {filteredEmojis ? (
              <div className="grid grid-cols-8 gap-1.5 text-center">
                {filteredEmojis.map((emoji, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onEmojiSelect(emoji);
                      setOpen(false);
                    }}
                    className="h-8 w-8 flex items-center justify-center text-xl rounded-lg hover:bg-accent hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5 px-1">
                  {EMOJI_CATEGORIES[activeCategory].label}
                </p>
                <div className="grid grid-cols-8 gap-1.5 text-center">
                  {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onEmojiSelect(emoji);
                        setOpen(false);
                      }}
                      className="h-8 w-8 flex items-center justify-center text-xl rounded-lg hover:bg-accent hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
