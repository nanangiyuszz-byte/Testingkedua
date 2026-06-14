import { Heart, ExternalLink, Trash2, Link as LinkIcon, Twitter, Facebook, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getSignedUrl } from "@/lib/storage";
import { VerifiedBadge, isVerifiedEmail } from "@/components/verified-badge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type ProjectWithAuthor = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string;
  link: string | null;
  tags: string[];
  created_at: string;
  author: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
  likes_count: number;
  liked_by_me: boolean;
};

export function ProjectCard({
  project,
  currentUserId,
  onDeleted,
  onLikeToggled,
}: {
  project: ProjectWithAuthor;
  currentUserId?: string | null;
  onDeleted?: (id: string) => void;
  onLikeToggled?: (id: string, liked: boolean) => void;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    let active = true;
    getSignedUrl("project-images", project.image_url)
      .then((u) => { if (active) setImgUrl(u); })
      .catch(() => {});
    return () => { active = false; };
  }, [project.image_url]);

  const isOwner = currentUserId === project.user_id;
  const verified = isVerifiedEmail(project.author?.email);

  const projectShareUrl = project.author?.username 
    ? `${window.location.origin}/u/${project.author.username}`
    : window.location.origin;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(projectShareUrl);
        toast.success("Tautan berhasil disalin!");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = projectShareUrl;
        textArea.style.position = "fixed"; 
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          toast.success("Tautan berhasil disalin!");
        } else {
          toast.error("Gagal menyalin tautan dari browser ini.");
        }
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menyalin tautan.");
    }
  };

  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      toast.error("Masuk dulu untuk menyukai project.");
      return;
    }
    setLiking(true);
    if (project.liked_by_me) {
      await supabase.from("likes").delete().eq("user_id", currentUserId).eq("project_id", project.id);
      onLikeToggled?.(project.id, false);
    } else {
      await supabase.from("likes").insert({ user_id: currentUserId, project_id: project.id });
      onLikeToggled?.(project.id, true);
    }
    setLiking(false);
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Hapus Project ini secara permanen?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) {
      toast.error("Gagal menghapus.");
      return;
    }
    await supabase.storage.from("project-images").remove([project.image_url]);
    toast.success("Project berhasil dihapus.");
    onDeleted?.(project.id);
  }

  return (
    <div className="glass card-lift group relative overflow-hidden rounded-2xl">
      <div className="relative aspect-[16/10] overflow-hidden bg-accent/40">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-accent/30" />
        )}
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold">{project.title}</h3>
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 text-muted-foreground hover:text-primary"
            >
              <ExternalLink size={15} />
            </a>
          )}
        </div>
        
        {/* Deskripsi tampil penuh tanpa line-clamp */}
        <div className="mb-1">
          <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {project.description}
          </p>
        </div>

        {project.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-primary/20"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          {project.author?.username ? (
            <Link
              to="/u/$username"
              params={{ username: project.author.username }}
              className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-bold uppercase">
                {project.author.avatar_url ? (
                  <img src={project.author.avatar_url} className="h-6 w-6 rounded-full object-cover" alt="" />
                ) : (
                  project.author.username.slice(0, 2)
                )}
              </div>
              <span className="truncate">@{project.author.username}</span>
              {verified && <VerifiedBadge size={12} />}
            </Link>
          ) : <span />}

          <div className="flex items-center gap-2">
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  title="Opsi Lainnya"
                >
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                
                <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2">
                  <LinkIcon size={14} />
                  <span>Salin Tautan</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(projectShareUrl)}&text=Lihat project keren buatan @${project.author?.username || 'developer'} di website ini!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Twitter size={14} />
                    <span>Bagikan ke X</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(projectShareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Facebook size={14} />
                    <span>Bagikan ke Facebook</span>
                  </a>
                </DropdownMenuItem>

                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleDelete} 
                      className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 size={14} />
                      <span>Hapus Project</span>
                    </DropdownMenuItem>
                  </>
                )}
                
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={toggleLike}
              disabled={liking}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                project.liked_by_me
                  ? "bg-primary/15 text-primary ring-1 ring-primary/40 shadow-[0_0_16px_-4px_oklch(0.65_0.21_255_/_0.7)]"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Heart size={14} fill={project.liked_by_me ? "currentColor" : "none"} />
              {project.likes_count}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
