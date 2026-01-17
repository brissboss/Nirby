import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 780 814"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-10", className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M237.016 328.612C237.016 328.612 508.965 53.7813 477.702 34.9728C446.439 16.1644 42.4547 -38.7979 28.9783 45.7357C15.5019 130.269 -28.8773 563.189 28.9783 549.463C86.8339 535.737 237.016 328.612 237.016 328.612Z"
        className="fill-primary"
      />
      <path
        d="M210.713 526.969C254.7 576.161 497.069 767.231 455.005 802.138C412.941 837.045 85.8629 783.961 29.7632 782.289C-26.3366 780.617 10.6272 677.636 29.7632 644.441C48.8991 611.247 166.726 477.777 210.713 526.969Z"
        className="fill-black dark:fill-white"
      />
      <path
        d="M739.266 727.728C683.578 770.215 575.452 770.167 539.897 758.094C504.341 746.021 280.528 498.954 238.062 455.708C195.596 412.461 571.845 56.4081 599.377 45.736C626.909 35.0638 670.047 14.5679 731.188 45.736C792.329 76.904 794.954 685.24 739.266 727.728Z"
        className="fill-black dark:fill-white"
      />
    </svg>
  );
}
