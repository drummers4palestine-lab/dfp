import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drum, Music, Volume2, Zap } from "lucide-react";

export default function Instruments() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-2 sm:px-3 lg:px-4 py-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="street-text font-bold text-3xl sm:text-4xl md:text-5xl mb-4">Instruments</h1>
          <p className="text-lg sm:text-xl text-gray-300">Master the tools of resistance rhythms</p>
        </div>

        {/* Samba Instruments Section */}
        <section className="mb-12">
          <h2 className="street-text text-2xl sm:text-3xl font-bold mb-8 text-red-500">Samba Instruments</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Surdo */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Drum className="h-6 w-6 text-red-500" />
                  Surdo (Bass Drums)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    <strong>Function:</strong> The heartbeat of the ensemble. Provides the foundational bass rhythm that locks in the groove.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-900 p-3 rounded border border-gray-600">
                      <p className="text-red-400 font-bold text-sm mb-1">Low Surdo (Primeira/1st)</p>
                      <p className="text-gray-300 text-xs">
                        Largest drum, deepest tone. Plays on beat 1 and 3, providing the main pulse. 
                        Essential for keeping the whole group together.
                      </p>
                    </div>
                    
                    <div className="bg-gray-900 p-3 rounded border border-gray-600">
                      <p className="text-yellow-400 font-bold text-sm mb-1">Medium Surdo (Segunda/2nd)</p>
                      <p className="text-gray-300 text-xs">
                        Mid-range tone. Plays on beats 2 and 4, creating the counter-rhythm. 
                        Works with Low Surdo to create the fundamental samba groove.
                      </p>
                    </div>
                    
                    <div className="bg-gray-900 p-3 rounded border border-gray-600">
                      <p className="text-blue-400 font-bold text-sm mb-1">High Surdo (Terceira/3rd)</p>
                      <p className="text-gray-300 text-xs">
                        Smallest surdo, brightest tone. Adds rhythmic variation and fills. 
                        Often plays syncopated patterns that dance around the main beats.
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm">
                    <strong>How to Play:</strong> Use a padded mallet. Strike the center for deep bass, edge for sharper tone. 
                    Each surdo has its specific role in the rhythmic foundation.
                  </p>
                  <p className="text-yellow-400 text-sm">
                    <strong>Protest Role:</strong> Creates the powerful foundation that carries chants and unifies the crowd
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Repinique */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Volume2 className="h-6 w-6 text-red-500" />
                  Repinique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">
                    <strong>Function:</strong> High-pitched metal drum that cuts through the mix. Often leads breaks and calls in samba arrangements.
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>How to Play:</strong> Use one stick and one hand. Stick for sharp accents, hand for controlled tones.
                    Can play rim shots for extra punch.
                  </p>
                  <p className="text-yellow-400 text-sm">
                    <strong>Drumming Role:</strong> Commands attention and signals rhythm changes
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Snare */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Zap className="h-6 w-6 text-red-500" />
                  Snare Drum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">
                    <strong>Function:</strong> Provides rhythmic complexity and drive. Essential for pattern variations and fills.
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>How to Play:</strong> Use matched grip with drumsticks. Focus on clean, consistent strokes.
                    Master basic rudiments for advanced patterns.
                  </p>
                  <p className="text-yellow-400 text-sm">
                    <strong>Drumming Role:</strong> Adds rhythmic texture and dynamic intensity
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tamborim */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Music className="h-6 w-6 text-red-500" />
                  Tamborim
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">
                    <strong>Function:</strong> Small frame drum creating intricate patterns and flourishes.
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>How to Play:</strong> Hold with non-dominant hand, play with flexible plastic stick.
                    Use wrist motion for rapid-fire patterns.
                  </p>
                  <p className="text-yellow-400 text-sm">
                    <strong>Drumming Role:</strong> Adds texture and maintains rhythmic continuity
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Agogô */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Volume2 className="h-6 w-6 text-red-500" />
                  Agogô
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">
                    <strong>Function:</strong> Double cowbell providing melodic rhythm and tempo reference.
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>How to Play:</strong> Strike with wooden stick. High bell for accents, low bell for steady pulse.
                    Creates interlocking patterns with other instruments.
                  </p>
                  <p className="text-yellow-400 text-sm">
                    <strong>Drumming Role:</strong> Keeps tempo and provides melodic rhythm reference
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Shaker */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Music className="h-6 w-6 text-red-500" />
                  Shaker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">
                    <strong>Function:</strong> Fills rhythmic space with continuous texture and drive.
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>How to Play:</strong> Shake in steady 16th note patterns. Vary intensity for dynamics.
                    Can play accents on strong beats.
                  </p>
                  <p className="text-yellow-400 text-sm">
                    <strong>Drumming Role:</strong> Unifies the ensemble, accessible for beginners
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Snare Rudiments Section */}
        <section>
          <h2 className="street-text text-2xl sm:text-3xl font-bold mb-8 text-red-500">Snare Rudiments</h2>
          <div className="grid md:grid-cols-2 gap-6">
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">Single Stroke Roll</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">
                    <strong>Pattern:</strong> R L R L R L R L (alternating hands)
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>Purpose:</strong> Foundation for all other rudiments. Builds hand coordination and even spacing.
                  </p>
                  <p className="text-yellow-400 text-sm">
                    <strong>Application:</strong> Creates sustained intensity and smooth roll effects
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">Double Stroke Roll</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">
                    <strong>Pattern:</strong> RR LL RR LL (two hits per hand)
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>Purpose:</strong> Develops wrist control and produces fuller sound. Essential for roll effects.
                  </p>
                  <p className="text-yellow-400 text-sm">
                    <strong>Application:</strong> Builds dramatic tension and creates fuller sound textures
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">Paradiddle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">
                    <strong>Pattern:</strong> R L R R, L R L L (accent on first stroke)
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>Purpose:</strong> Combines single and double strokes. Creates natural accent patterns.
                  </p>
                  <p className="text-yellow-400 text-sm">
                    <strong>Application:</strong> Matches natural speech patterns and creates dynamic accents
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">Flam</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">
                    <strong>Pattern:</strong> lR (grace note + main stroke, almost simultaneous)
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>Purpose:</strong> Creates fuller, more powerful accents. Adds color to basic patterns.
                  </p>
                  <p className="text-yellow-400 text-sm">
                    <strong>Application:</strong> Emphasizes key accents and adds dynamic color
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">Drag (Ruff)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">
                    <strong>Pattern:</strong> ll R (two grace notes + main stroke)
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>Purpose:</strong> Creates dramatic build-up effects. Adds textural variation.
                  </p>
                  <p className="text-yellow-400 text-sm">
                    <strong>Application:</strong> Signals important moments and section transitions
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">Rim Shot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">
                    <strong>Technique:</strong> Strike rim and head simultaneously for sharp crack
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>Purpose:</strong> Maximum volume and attention-getting power. Cuts through crowd noise.
                  </p>
                  <p className="text-yellow-400 text-sm">
                    <strong>Application:</strong> Maximum volume and attention-getting power
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-900 border-red-500 mt-8">
            <CardHeader>
              <CardTitle className="text-red-400">Practice Tips for Ensemble Drumming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-gray-300 text-sm">
                <p>• <strong>Start Slow:</strong> Master the motion before increasing speed</p>
                <p>• <strong>Use a Metronome:</strong> Consistent timing is crucial for group synchronization</p>
                <p>• <strong>Practice with Others:</strong> Develop listening skills and ensemble awareness</p>
                <p>• <strong>Build Endurance:</strong> Long sessions require stamina - develop gradually</p>
                <p>• <strong>Listen and Adapt:</strong> Watch for conductor signals and dynamic changes</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}