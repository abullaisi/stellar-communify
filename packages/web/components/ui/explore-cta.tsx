import Link from 'next/link';

import { Icon } from './icon';

/**
 * Prominent entry point into `/explore` (public community/content browsing). Styled as
 * an accent pill rather than a plain text link so it reads as an inviting action, not
 * a footnote.
 */
export function ExploreCta({ style }: { style?: React.CSSProperties }) {
  return (
    <Link href="/explore" className="explore-cta" style={style}>
      <Icon name="sparkle" size={15} />
      Explore communities &amp; content
      <Icon name="arrow-right" size={15} />
    </Link>
  );
}
