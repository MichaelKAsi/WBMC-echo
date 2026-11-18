import { useState } from "react";
import { Download, FileText, Search, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Sermon {
  title: string;
  imageUrl: string;
  downloadUrl: string;
}

const sermons: Sermon[] = [
  { title: "You Too Are The Reason Someone Is Coming To Church", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/07/YOU-TOO-ARE-THE-REASON-SOMEONE-IS-COMING-TO-CHURCH.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/07/YOU-TOO-ARE-A-REASON-SOMEONE-IS-COMING.pptx" },
  { title: "Your Church Building Is NOT God's Temple", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/06/Your-church-building-is-NOT-Gods-temple.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/06/Your-church-building-is-NOT-Gods-temple.pptx" },
  { title: "It Is Not Prayer Until You Pray It", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/06/IT-IS-NOT-PRAYER-UNTIL-YOU-PRAY-IT.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/06/IT-IS-NOT-PRAYER-UNTILL-YOU-PRAY-IT.pptx" },
  { title: "What Thereafter", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/06/what-thereafter.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/06/What-Thereafter.pdf" },
  { title: "A Mustard Seed Sized Faith", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/06/A-mustard-seed-sized-Faith.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/06/A-mustard-seed-sized-Faith.pdf" },
  { title: "A Godly Mother", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/05/A-GODLY-MOTHER.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/05/A-GODLY-MOTHER-11-May-2025.pdf" },
  { title: "False Believer", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/04/False-Believer-Sermon.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/04/FALSE-BELIVER-APRIL-2025-1.pptx" },
  { title: "Competition", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/04/COMPETITION-1.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/04/Competition.pptx" },
  { title: "Restoration of Sight", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/03/Restoration-of-Sight.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/03/Restoration-of-Sight.pdf" },
  { title: "Develop An Inner Pattern of Strength", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/03/Develop-an-inner-pattern-of-strength-within.-nion-1.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/03/Gods-Promises-are-a-Big-Yes-1.pdf" },
  { title: "Holy Communion", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/03/Holy-Communion.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/03/Gods-Promises-are-a-Big-Yes.pdf" },
  { title: "You Are The Light Since The Beginning", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/02/YOU-ARE-THE-LIGHT-SINCE-THE-BEGINNING-image.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/02/YOU-ARE-THE-LIGHT-SINCE-THE-BEGINNING.pdf" },
  { title: "God's Promises Are A Big Yes", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/02/GODS-PROMISES-ARE-A-BIG-YES-.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/02/Gods-Promises-are-a-Big-Yes.pdf" },
  { title: "Put Away Childish Things", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/01/Put-away-childish-things.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/01/Put-away-childish-things.pdf" },
  { title: "Sins That Are Counted Among Deadly", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/01/SINS-THAT-ARE-COUNTED-AMONG-DEADLY-.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/01/Sins-that-are-counted-among-Deadly.pdf" },
  { title: "Prayer and Fasting", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2025/01/WBMC-KNOW-YOUR-CHURCH-PRESENTATION-1.png?fit=1920%2C1080&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2025/01/Prayer-and-Fasting-12-Jan-20251.pdf" },
  { title: "Godly Families Part 2", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2024/10/WBMC-Sermon-Graphics-7.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2024/10/Godly-families-Part-2.pdf" },
  { title: "The Benefits of Being Rooted", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2024/10/WBMC-Sermon-Graphics-5.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2024/10/The-Benefits-of-Being-Rooted-Sermon-notes.pdf" },
  { title: "Godly Families", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2024/10/WBMC-Sermon-Graphics-2.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2024/10/Godly-Families-Sermon-notes.pdf" },
  { title: "WBMC Deacons", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2024/09/WBMC-Sermon-Graphics-1.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2024/09/WBMC-Deacons-Sep-24.pdf" },
  { title: "Lukewarmness", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2024/09/lukewarmness-1.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2024/09/WBMC-Sermon-notes.pdf" },
  { title: "Dealing With Sin In The Church", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2024/09/Dealing-with-Sin-in-Th-e-Church-Correcting-Another-Believer.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2024/09/Dealing-with-Sin-in-Th-e-Church-Correcting-Another-Believer-Ps-Bently-Tladi.pdf" },
  { title: "Spiritual Gifts", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2024/09/SPIRITUAL-GIFTS-1-1.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2024/08/An-Enabling-Power-of-God-Ps-Refilwe-Tladi.pdf" },
  { title: "An Enabling Power of God", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2024/08/An-Enabling-Power-of-God.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2024/08/An-Enabling-Power-of-God-Ps-Refilwe-Tladi.pdf" },
  { title: "Ability", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2024/08/Ability-1.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2024/08/Ability-sermon.pdf" },
  { title: "Spirit. Soul. Body.", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2024/08/Spirit.-Soul.-Body.pdf-1.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2024/08/Spirit.-Soul.-Body.pdf" },
  { title: "Different Types of Givers", imageUrl: "https://i0.wp.com/wordbmc.co.za/wp-content/uploads/2024/07/DIFFERENT-TYPES-OF-GIVERS.png?fit=800%2C671&ssl=1", downloadUrl: "https://wordbmc.co.za/wp-content/uploads/2024/07/DIFFERENT-TYPES-OF-GIVERS.pdf" },
];

function getFileType(url: string): string {
  if (url.endsWith(".pdf")) return "PDF";
  if (url.endsWith(".pptx")) return "PPTX";
  if (url.endsWith(".docx")) return "DOCX";
  return "File";
}

export function SermonLibraryTab() {
  const [search, setSearch] = useState("");

  const filtered = sermons.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sermons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} sermons available</p>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map((sermon, i) => {
          const fileType = getFileType(sermon.downloadUrl);
          return (
            <div key={i} className="rounded-xl overflow-hidden border border-border bg-card shadow-sm">
              <img
                src={sermon.imageUrl}
                alt={sermon.title}
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
              />
              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-sm text-foreground leading-tight">{sermon.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {fileType}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => window.open(sermon.downloadUrl, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      asChild
                    >
                      <a href={sermon.downloadUrl} download>
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No sermons found</p>
          <p className="text-sm">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
