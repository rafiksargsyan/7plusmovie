import { Nullable } from "../../../Nullable";
import { SubsAuthor } from "../value-object/SubsAuthor";
import { TorrentTracker } from "../value-object/TorrentTracker";

export function resolveSubsAuthor(title: Nullable<string>, tracker: Nullable<TorrentTracker>) {
  if (title == null) return null;
  title = title.toLowerCase();
  const hdrezak18PlusRegex = /hdrezka.*18\+/;
  const coolStoryBlogRegex = /cool.*story.*blog/;
  const coolStoryBlog18PlusRegex = /cool.*story.*blog.*18\+/;
  if (title.match(hdrezak18PlusRegex) != null) return SubsAuthor.HDREZKA_18PLUS;
  if (title.match(coolStoryBlog18PlusRegex) != null) return SubsAuthor.COOL_STORY_BLOG_18PLUS;
  if (title.includes("hdrezka")) return SubsAuthor.HDREZKA;
  if (title.includes("tvshows")) return SubsAuthor.TVSHOWS;
  if (title.includes('киномания')) return SubsAuthor.KINOMANIA;
  if (title.match(coolStoryBlogRegex)) return SubsAuthor.COOL_STORY_BLOG;
  return null;
}