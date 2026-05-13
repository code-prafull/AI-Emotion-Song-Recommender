import React from 'react';

const Song = ({ songs }) => {

  return (

    <div className="space-y-5">

      {
        songs && songs.length > 0 ? (

          songs.map((s, i) => (

            <div
              key={i}
              className="bg-zinc-900 border border-zinc-700 rounded-3xl p-4 hover:bg-zinc-800 transition-all duration-300 shadow-lg"
            >

              {/* TOP */}
              <div className="flex items-center justify-between">

                <div className="flex items-center gap-4">

                  {/* SONG IMAGE */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white shadow-md">
                    🎵
                  </div>

                  {/* SONG INFO */}
                  <div>

                    <h3 className="text-white text-xl font-bold">
                      {s.title}
                    </h3>

                    <p className="text-zinc-400 text-sm mt-1">
                      {s.artist}
                    </p>

                  </div>

                </div>

                {/* STATUS */}
                <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
                  Playing
                </div>

              </div>

              {/* AUDIO */}
              <div className="mt-4">

                <audio
                  controls
                  src={s.audio}
                  className="w-full rounded-xl"
                />

              </div>

            </div>
          ))

        ) : (

          <div className="flex flex-col items-center justify-center h-[300px] text-center">

            <div className="text-6xl mb-4">
              🎧
            </div>

            <h2 className="text-white text-2xl font-bold">
              No Songs Found
            </h2>

            <p className="text-zinc-400 mt-2">
              Try changing your mood expression
            </p>

          </div>
        )
      }

    </div>
  );
};

export default Song;