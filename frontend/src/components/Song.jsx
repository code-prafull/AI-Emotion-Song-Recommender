const Song = ({ songs }) => {
  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto p-4">
      {songs && songs.length > 0 ? (
        songs.map((s, i) => (
          <div
            key={i}
            className="group relative bg-[#121212] border border-zinc-800/80 rounded-2xl p-4 md:p-5 hover:bg-[#1a1a1a] hover:border-zinc-700 transition-all duration-300 shadow-xl overflow-hidden"
          >
            {/* Spotify Style Subtle Glow */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500 pointer-events-none" />

            {/* TOP SECTION */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {/* SONG IMAGE */}
                <div className="relative w-14 h-14 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center text-xl text-white shadow-inner flex-shrink-0 overflow-hidden border border-zinc-700/50">
                  {s.image ? (
                    <img src={s.image} alt="Song Art" className="w-full h-full object-cover" />
                  ) : (
                    <span className="transform group-hover:scale-110 transition-transform duration-300">🎵</span>
                  )}
                </div>

                {/* SONG INFO */}
                <div className="min-w-0">
                  <h3 className="text-white text-base md:text-lg font-bold tracking-wide truncate group-hover:text-emerald-400 transition-colors duration-200">
                    {s.title}
                  </h3>
                  <p className="text-zinc-400 text-xs md:text-sm mt-0.5 truncate font-medium">
                    {s.artist}
                  </p>
                </div>
              </div>

              {/* STATUS BADGE */}
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold tracking-wide flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Playing
              </div>
            </div>

            {/* SPOTIFY STYLE AUDIO PLAYER CONTAINER */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center">
              <audio
                controls
                src={s.audio}
                className="w-full h-9 spotify-audio-player opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>

            {/* Custom CSS to Darken/Style Audio Player for Chrome/Edge/Safari */}
            <style dangerouslySetInnerHTML={{ __html: `
              .spotify-audio-player {
                filter: invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%);
                border-radius: 8px;
              }
            `}} />
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center h-[320px] text-center bg-[#121212] border border-zinc-800/50 rounded-3xl p-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center text-3xl mb-4 shadow-inner border border-zinc-800">
            🎧
          </div>
          <h2 className="text-white text-xl font-bold tracking-wide">
            No Songs Found
          </h2>
          <p className="text-zinc-400 text-sm mt-1 max-w-xs">
            Try changing your mood expression to discover new tracks.
          </p>
        </div>
      )}
    </div>
  );
};

export default Song;