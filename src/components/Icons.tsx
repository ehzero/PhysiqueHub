import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  List,
  MapPin,
  MessageCircle,
  Search,
  Share2,
  Tag,
  X,
} from "lucide-react";

const iconProps = {
  "aria-hidden": true,
  focusable: false,
  strokeWidth: 2,
} as const;

export const Icons = {
  search: <Search {...iconProps} />,
  bookmark: <Bookmark {...iconProps} />,
  bookmarkFilled: <Bookmark {...iconProps} fill="currentColor" />,
  arrow: <ArrowRight {...iconProps} />,
  arrowDown: <ArrowDown {...iconProps} />,
  arrowLeft: <ArrowLeft {...iconProps} />,
  sort: <ArrowUpDown {...iconProps} />,
  chevronDown: <ChevronDown {...iconProps} />,
  close: <X {...iconProps} />,
  list: <List {...iconProps} />,
  contact: <MessageCircle {...iconProps} />,
  cal: <CalendarDays {...iconProps} />,
  pin: <MapPin {...iconProps} />,
  tag: <Tag {...iconProps} />,
  check: <Check {...iconProps} strokeWidth={3} />,
  share: <Share2 {...iconProps} />,
  ext: <ExternalLink {...iconProps} />,
};
