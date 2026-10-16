import type { IconBaseProps } from "react-icons";
import { FaGithub } from "react-icons/fa";

// GitHub's mark is one colour by design: it follows the text colour.
export function GitHubIcon(props: IconBaseProps) {
  return <FaGithub aria-hidden {...props} />;
}
