import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Music, Target, Volume2 } from "lucide-react";
import TimeSignatureTool from "@/components/time-signature-tool";

export default function Theory() {
  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-2 sm:px-3 lg:px-4 py-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="street-text font-bold text-3xl sm:text-4xl md:text-5xl mb-4">Theory</h1>
          <p className="text-lg sm:text-xl text-gray-300">Playing with the chants, not over them</p>
        </div>

        {/* Time Signature & Basic Theory */}
        <section className="mb-12">
          <h2 className="street-text text-2xl sm:text-3xl font-bold mb-8 text-red-500">Rhythm Fundamentals</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="h-6 w-6 text-red-500" />
                  Time Signature: 4/4
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    <strong>What it means:</strong> 4 beats per bar, quarter note gets the beat
                  </p>
                  <div className="bg-black p-4 rounded border border-gray-600">
                    <p className="text-center text-lg font-mono text-white mb-2">4/4 Time</p>
                    <div className="flex justify-center items-center gap-4">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mb-1">1</div>
                        <p className="text-xs text-gray-400">Strong</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold mb-1">2</div>
                        <p className="text-xs text-gray-400">Weak</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold mb-1">3</div>
                        <p className="text-xs text-gray-400">Medium</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold mb-1">4</div>
                        <p className="text-xs text-gray-400">Weak</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-yellow-400 text-sm">
                    <strong>Why 4/4?</strong> This time signature matches natural speech rhythms and is easy for groups to follow.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Music className="h-6 w-6 text-red-500" />
                  Bars & Counts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    <strong>Bar (Measure):</strong> A complete cycle of 4 beats
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>Count:</strong> Each individual beat within the bar (1, 2, 3, 4)
                  </p>
                  <div className="bg-black p-4 rounded border border-gray-600">
                    <p className="text-center text-white font-mono mb-3">One Complete Bar</p>
                    <div className="flex justify-between items-center">
                      <span className="text-red-500 font-bold">|</span>
                      <span className="text-white">1</span>
                      <span className="text-white">2</span>
                      <span className="text-white">3</span>
                      <span className="text-white">4</span>
                      <span className="text-red-500 font-bold">|</span>
                    </div>
                  </div>
                  <p className="text-yellow-400 text-sm">
                    <strong>Pattern Loops:</strong> Most rhythm patterns repeat every 1-2 bars, making them easy to learn and maintain.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Interactive Time Signature Tool */}
          <TimeSignatureTool />
        </section>

        {/* Rhythm Examples */}
        <section className="mb-12">
          <h2 className="street-text text-2xl sm:text-3xl font-bold mb-8 text-red-500">Rhythm Examples in 4/4 Time</h2>
          
          <div className="space-y-6">
            
            {/* Basic Quarter Notes */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">Basic Quarter Note Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-black p-6 rounded border border-gray-600">
                    <p className="text-center text-gray-400 mb-4">One Beat Per Count</p>
                    <div className="flex justify-center items-center gap-8 mb-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mb-2 animate-pulse">1</div>
                        <p className="text-red-400 font-bold">BEAT</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold mb-2 animate-pulse" style={{animationDelay: '0.25s'}}>2</div>
                        <p className="text-gray-400 font-bold">BEAT</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold mb-2 animate-pulse" style={{animationDelay: '0.5s'}}>3</div>
                        <p className="text-gray-400 font-bold">BEAT</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold mb-2 animate-pulse" style={{animationDelay: '0.75s'}}>4</div>
                        <p className="text-gray-400 font-bold">BEAT</p>
                      </div>
                    </div>
                    <p className="text-center text-gray-400 text-sm">Equal emphasis on every beat</p>
                  </div>
                  <p className="text-gray-300 text-sm">
                    <strong>Application:</strong> Foundation pattern for learning timing. Strong beat 1 provides rhythmic anchor.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Accent Pattern */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">Strong Beat Emphasis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-black p-6 rounded border border-gray-600">
                    <p className="text-center text-gray-400 mb-4">Accent on Beats 1 & 3</p>
                    <div className="flex justify-center items-center gap-8 mb-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mb-2">1</div>
                        <p className="text-red-400 font-bold">STRONG</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold mb-2">2</div>
                        <p className="text-gray-400">weak</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white font-bold mb-2">3</div>
                        <p className="text-red-400 font-bold">STRONG</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold mb-2">4</div>
                        <p className="text-gray-400">weak</p>
                      </div>
                    </div>
                    <p className="text-center text-gray-400 text-sm">Natural rhythm emphasis pattern</p>
                  </div>
                  <p className="text-gray-300 text-sm">
                    <strong>Application:</strong> Common pattern in many musical styles. Helps establish rhythmic drive and groove.
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </section>

        {/* Protest Chant Examples - Educational */}
        <section>
          <h2 className="street-text text-2xl sm:text-3xl font-bold mb-8 text-red-500">Common Protest Chants - Rhythm Analysis</h2>
          
          <div className="mb-6 bg-gray-900 border-red-500 border p-4 rounded">
            <p className="text-red-400 font-bold mb-2">Educational Purpose</p>
            <p className="text-gray-300 text-sm">
              These examples show how protest chants naturally fit into 4/4 time signatures. Understanding these rhythms helps drummers provide proper support without overpowering the voices.
            </p>
          </div>
          
          <div className="grid gap-6">
            {/* 1 2 3 4 Occupation No More */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">"1, 2, 3, 4 - Occupation No More"</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-black p-6 rounded border border-gray-600">
                    <p className="text-center text-gray-400 mb-4">Two-Bar Pattern</p>
                    
                    {/* First Bar */}
                    <div className="mb-6">
                      <p className="text-center text-white mb-2">Bar 1</p>
                      <div className="flex justify-center items-center gap-8 mb-2">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold mb-2">1</div>
                          <p className="text-yellow-400 font-bold">ONE</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold mb-2">2</div>
                          <p className="text-yellow-400 font-bold">TWO</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold mb-2">3</div>
                          <p className="text-yellow-400 font-bold">THREE</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold mb-2">4</div>
                          <p className="text-yellow-400 font-bold">FOUR</p>
                        </div>
                      </div>
                    </div>

                    {/* Second Bar */}
                    <div>
                      <p className="text-center text-white mb-2">Bar 2</p>
                      <div className="flex justify-center items-center gap-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mb-2">1</div>
                          <p className="text-red-400 font-bold">OC-CU-</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mb-2">2</div>
                          <p className="text-red-400 font-bold">-PA-TION</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mb-2">3</div>
                          <p className="text-red-400 font-bold">NO</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mb-2">4</div>
                          <p className="text-red-400 font-bold">MORE</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    <strong>Teaching Tool:</strong> This chant teaches counting while building solidarity. The numbers establish the beat, then the message reinforces it.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* From the River to the Sea */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">"From the River to the Sea"</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-black p-6 rounded border border-gray-600">
                    <p className="text-center text-gray-400 mb-4">Two-Bar Pattern</p>
                    
                    {/* Bar 1 */}
                    <div className="mb-6">
                      <p className="text-center text-white mb-2">Bar 1</p>
                      <div className="flex justify-center items-center gap-8 mb-2">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mb-2">1</div>
                          <p className="text-green-400 font-bold">FROM</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mb-2">2</div>
                          <p className="text-green-400 font-bold">THE</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mb-2">3</div>
                          <p className="text-green-400 font-bold">RI-VER</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mb-2">4</div>
                          <p className="text-green-400 font-bold">TO THE SEA</p>
                        </div>
                      </div>
                    </div>

                    {/* Bar 2 */}
                    <div>
                      <p className="text-center text-white mb-2">Bar 2</p>
                      <div className="flex justify-center items-center gap-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mb-2">1</div>
                          <p className="text-red-400 font-bold">PAL-</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mb-2">2</div>
                          <p className="text-red-400 font-bold">-ES-TINE</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black font-bold mb-2">3</div>
                          <p className="text-white font-bold">WILL</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black font-bold mb-2">4</div>
                          <p className="text-white font-bold">BE FREE</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    <strong>Two-Bar Structure:</strong> This chant flows naturally over two bars, with strong emphasis on key words and natural pauses for drum support.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Intifada */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">"Intifada, Intifada"</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-black p-6 rounded border border-gray-600">
                    <div className="flex justify-center items-center gap-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mb-2">1</div>
                        <p className="text-purple-400 font-bold">IN-TI-</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mb-2">2</div>
                        <p className="text-purple-400 font-bold">-FA-DA</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mb-2">3</div>
                        <p className="text-purple-400 font-bold">IN-TI-</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mb-2">4</div>
                        <p className="text-purple-400 font-bold">-FA-DA</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    <strong>Repetitive Power:</strong> The repeated word creates hypnotic rhythm that's easy to maintain and builds collective energy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pattern Application */}
        <section>
          <h2 className="street-text text-2xl sm:text-3xl font-bold mb-8 text-red-500">Supporting the Chants</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="h-6 w-6 text-red-500" />
                  Playing Around the Voices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-gray-300 text-sm">
                  <p><strong>Count with the Chant:</strong> Master the 4/4 timing to stay perfectly in sync</p>
                  <p><strong>Find the Gaps:</strong> Play between vocal lines, not over them</p>
                  <p><strong>Support, Don't Lead:</strong> Follow the crowd's energy and tempo</p>
                  <p><strong>Listen First:</strong> Hear the natural rhythm before adding drums</p>
                  <p><strong>Volume Awareness:</strong> Adjust dynamics to complement, never overpower</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Volume2 className="h-6 w-6 text-red-500" />
                  Building Solidarity Through Rhythm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-gray-300 text-sm">
                  <p><strong>Tempo Unity:</strong> Keep steady time to help the crowd stay together</p>
                  <p><strong>Strategic Silence:</strong> Know when to stop playing for maximum impact</p>
                  <p><strong>Call and Response:</strong> Create space for crowd participation</p>
                  <p><strong>Cultural Respect:</strong> Honor the musical traditions of protest movements</p>
                  <p><strong>Inclusive Playing:</strong> Ensure everyone can follow and join in</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-900 border-red-500 mt-8">
            <CardHeader>
              <CardTitle className="text-red-400">Key Principles: Supporting Not Drowning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-gray-300 text-sm">
                <p>• <strong>Count with the Crowd:</strong> Master 4/4 timing to play perfectly in sync with chants</p>
                <p>• <strong>Listen Before Playing:</strong> Hear the natural rhythm of voices before adding drums</p>
                <p>• <strong>Fill the Spaces:</strong> Play between vocal lines, during pauses, never over the words</p>
                <p>• <strong>Support the Tempo:</strong> Help the crowd stay together without overpowering them</p>
                <p>• <strong>Dynamic Awareness:</strong> Adjust volume and intensity to complement, not compete</p>
                <p>• <strong>Unity First:</strong> Every beat should strengthen solidarity, not showcase individual skill</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Ensemble Playing Principles */}
        <section>
          <h2 className="street-text text-2xl sm:text-3xl font-bold mb-8 text-red-500">General Ensemble Playing</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="h-6 w-6 text-red-500" />
                  Playing with Others
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-gray-300 text-sm">
                  <p><strong>Listen First:</strong> Hear what others are playing before adding your part</p>
                  <p><strong>Find Your Space:</strong> Play between other parts, not over them</p>
                  <p><strong>Follow the Leader:</strong> Watch for conductor signals and tempo changes</p>
                  <p><strong>Dynamic Awareness:</strong> Adjust volume to fit the overall sound</p>
                  <p><strong>Timing Unity:</strong> Stay locked in with the group rhythm</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Volume2 className="h-6 w-6 text-red-500" />
                  Building Musical Unity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-gray-300 text-sm">
                  <p><strong>Steady Tempo:</strong> Help the group stay together with consistent timing</p>
                  <p><strong>Strategic Silence:</strong> Know when to rest for maximum impact</p>
                  <p><strong>Call and Response:</strong> Create space for musical conversation</p>
                  <p><strong>Support Others:</strong> Your role is to make the group sound better</p>
                  <p><strong>Stay Connected:</strong> Maintain eye contact and awareness</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-900 border-red-500 mt-8">
            <CardHeader>
              <CardTitle className="text-red-400">Key Principles: Playing Together</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-gray-300 text-sm">
                <p>• <strong>Listen Actively:</strong> Always be aware of what others are playing</p>
                <p>• <strong>Serve the Music:</strong> Your individual part serves the overall sound</p>
                <p>• <strong>Timing is Everything:</strong> Good time-keeping is more important than complex patterns</p>
                <p>• <strong>Volume Control:</strong> Blend with the group, don't dominate</p>
                <p>• <strong>Visual Awareness:</strong> Watch for cues and changes from leaders</p>
                <p>• <strong>Musical Conversation:</strong> Leave space for others to be heard</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}