import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText } from "lucide-react";
import { useI18n } from "@/i18n";

interface LegalSection {
  heading: string;
  paragraphs: string[];
}

interface LegalDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  sections: LegalSection[];
}

export function LegalDialog({ open, onClose, title, sections }: LegalDialogProps) {
  const { t } = useI18n();
  const lowered = title.toLowerCase();
  const isPrivacy = lowered.includes("privacy") || lowered.includes("gdpr") || lowered.includes("soukromí");
  const Icon = isPrivacy ? Shield : FileText;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] bg-card rounded-xl p-0 gap-0 border-border/50">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-[18px] w-[18px] text-primary" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-foreground tracking-tight">{title}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Localio Labs s.r.o.</p>
          </div>
        </div>

        <div className="h-px bg-border/50 mx-6" />

        {/* Content */}
        <ScrollArea className="max-h-[55vh]">
          <div className="px-6 py-5 space-y-6">
            {sections.map((section, i) => (
              <section key={section.heading}>
                <div className="flex items-baseline gap-2 mb-2.5">
                  <span className="text-[10px] font-bold text-primary/60 tabular-nums shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h4 className="text-[12px] font-semibold text-foreground tracking-tight">
                    {section.heading}
                  </h4>
                </div>
                <div className="space-y-2 pl-6">
                  {section.paragraphs.map((paragraph, j) => (
                    <p key={j} className="text-[11px] text-muted-foreground leading-[1.7]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="h-px bg-border/50 mx-6" />
        <div className="flex justify-center px-6 py-4">
          <button
            onClick={onClose}
            className="min-w-[100px] px-5 py-[7px] rounded-lg text-[12px] font-medium border border-border/50 bg-background/80 text-foreground hover:bg-secondary transition-all"
          >
            {t("common.close")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
