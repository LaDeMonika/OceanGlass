"use client";

import { useState } from "react";
import Icon from "./Icon";

/** Shows the thumbnail first and only loads YouTube when you press play. */
export default function VideoPlayer({
  videoId,
  title,
  playLabel,
  minutes,
  minLabel,
}: {
  videoId: string;
  title: string;
  playLabel: string;
  minutes?: number;
  minLabel: string;
}) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <div className="video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <button type="button" className="video" onClick={() => setPlaying(true)} aria-label={`${playLabel}: ${title}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" />
      <span className="play">
        <Icon name="play" />
      </span>
      <span className="vcap">
        <span>{title}</span>
        {minutes ? (
          <span>
            ~{minutes} {minLabel}
          </span>
        ) : null}
      </span>
    </button>
  );
}
