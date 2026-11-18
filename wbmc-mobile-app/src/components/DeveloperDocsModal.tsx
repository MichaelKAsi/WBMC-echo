import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";

interface DeveloperDocsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PDF_URL = "/WBMC_App_Documentation.pdf";

export function DeveloperDocsModal({ open, onOpenChange }: DeveloperDocsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Developer Documentation</DialogTitle>
          <DialogDescription>
            WBMC Mobile App — Technical &amp; Functional Documentation (Pages 1–2 preview)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 text-sm text-foreground">
            {/* Page 1 */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Page 1
              </p>
              <h2 className="text-lg font-bold">WBMC Mobile App</h2>
              <p className="text-muted-foreground mb-3">Technical &amp; Functional Documentation</p>
              <p className="mb-3">
                This document provides a comprehensive overview of the WBMC web application — its
                components, features, user roles, content management workflows, and the
                infrastructure that powers it.
              </p>
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
                <div className="flex gap-2"><span className="font-semibold w-32 shrink-0">Application</span><span>WBMC Mobile App (Web)</span></div>
                <div className="flex gap-2"><span className="font-semibold w-32 shrink-0">Published URL</span><a href="https://wbmc-mobile-app.lovable.app" target="_blank" rel="noreferrer" className="text-primary underline break-all">wbmc-mobile-app.lovable.app</a></div>
                <div className="flex gap-2"><span className="font-semibold w-32 shrink-0">Stack</span><span>React 18, Vite 5, TypeScript 5, Tailwind CSS v3</span></div>
                <div className="flex gap-2"><span className="font-semibold w-32 shrink-0">Backend</span><span>Lovable Cloud — Postgres, Auth, Storage, Edge Functions</span></div>
                <div className="flex gap-2"><span className="font-semibold w-32 shrink-0">Document Date</span><span>April 30, 2026</span></div>
              </div>

              <h3 className="font-semibold mt-4 mb-2">Contents</h3>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                <li>1. Overview</li>
                <li>2. User Roles &amp; Permissions</li>
                <li>3. Features</li>
                <li>4. Components</li>
                <li>5. Content Management</li>
                <li>6. Database &amp; Storage</li>
                <li>7. Authentication &amp; Security</li>
                <li>8. Infrastructure &amp; Deployment</li>
                <li>9. Routing &amp; Navigation</li>
                <li>10. Edge Functions &amp; Integrations</li>
              </ul>
            </section>

            {/* Page 2 */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Page 2
              </p>
              <h3 className="text-base font-bold">1. Overview</h3>
              <p className="mb-3">
                The WBMC Mobile App is a web-based application built for the WBMC church
                community. It delivers a mobile-first experience that combines spiritual content
                (Pastor's Corner, Bible study tools, hymns, sermons), community engagement
                (announcements, marketplace, gallery), and giving (Building Fund, donations) into a
                single, role-aware platform.
              </p>

              <h4 className="font-semibold mb-1">Design Principles</h4>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground mb-4">
                <li>Mobile-first UI with bottom navigation and an adaptive sidebar for desktop.</li>
                <li>Role-based access with five distinct user tiers and per-feature gating.</li>
                <li>Moderation workflow for user-submitted content (pending → approved / rejected).</li>
                <li>Realtime-ready backend with row-level security on every table.</li>
                <li>Design system driven by semantic tokens in index.css and tailwind.config.ts.</li>
              </ul>

              <h3 className="text-base font-bold mb-1">2. User Roles &amp; Permissions</h3>
              <p className="mb-3">
                Roles are stored in a dedicated <code className="text-xs bg-muted px-1 rounded">user_roles</code> table
                and resolved server-side through the <code className="text-xs bg-muted px-1 rounded">has_role()</code>{" "}
                security-definer function. This prevents privilege escalation by keeping role checks
                out of client-controlled data.
              </p>

              <div className="space-y-2 text-xs">
                <div className="rounded-md border border-border p-2"><span className="font-semibold">General User —</span> Browse public content, like &amp; comment, save Bible notes/bookmarks, donate, request merchant status.</div>
                <div className="rounded-md border border-border p-2"><span className="font-semibold">Approved Merchant —</span> All General User abilities, plus create/edit/delete up to three marketplace listings (initial uploads require approval).</div>
                <div className="rounded-md border border-border p-2"><span className="font-semibold">Manager —</span> Submit announcements, gallery and videos through the approval queue.</div>
                <div className="rounded-md border border-border p-2"><span className="font-semibold">Pastor —</span> Exclusive access to Pastor's Corner timeline — create, edit, schedule and delete posts with rich text and media.</div>
                <div className="rounded-md border border-border p-2"><span className="font-semibold">Admin —</span> Full system access: manage users &amp; roles, approve/reject content, edit Building Fund, manage announcements, gallery, sermons and Pastor posts.</div>
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
          <Button asChild variant="default" className="flex-1">
            <a href={PDF_URL} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> View full PDF
            </a>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <a href={PDF_URL} download>
              <Download className="h-4 w-4" /> Download
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
