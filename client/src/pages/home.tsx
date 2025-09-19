import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Heart, Users, Drum } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative keffiyeh-pattern min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-black opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="street-text font-bold text-4xl md:text-6xl mb-6 leading-tight">
                Drummers For <span className="text-white">Palestine</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-300">
                Unite through drumming. Learn resistance rhythms. UK's national drumming movement for Palestine.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/tunes">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                    <Play className="mr-2 h-5 w-5" />
                    Start Playing
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" size="lg" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative flex items-center justify-center p-8">
              <img src="/logo.png" alt="Drummers For Palestine" className="max-w-lg w-full h-auto opacity-80" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="street-text font-bold text-3xl md:text-4xl mb-4">Power Through Drumming</h2>
            <p className="text-xl text-gray-300">Professional-grade tools for creating resistance rhythms</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-black border-gray-700">
              <CardContent className="p-6 text-center">
                <Drum className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="street-text font-semibold text-xl mb-2">Authentic Rhythms</h3>
                <p className="text-gray-300">Traditional percussion instruments with professional-quality samples</p>
              </CardContent>
            </Card>
            <Card className="bg-black border-gray-700">
              <CardContent className="p-6 text-center">
                <Heart className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="street-text font-semibold text-xl mb-2">Protest Beats</h3>
                <p className="text-gray-300">Specially crafted rhythms for marches, demonstrations, and solidarity actions</p>
              </CardContent>
            </Card>
            <Card className="bg-black border-gray-700">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="street-text font-semibold text-xl mb-2">Community</h3>
                <p className="text-gray-300">Connect with drummers worldwide supporting Palestinian liberation</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Drum className="h-6 w-6 text-red-600" />
            <span className="street-text font-bold text-xl">Drummers For Palestine</span>
          </div>
          <p className="text-gray-400 mb-4">Drumming unites us in the struggle for justice</p>
          <p className="text-sm text-gray-400">
            &copy; 2024 Drummers For Palestine. Free Palestine 🇵🇸
          </p>
        </div>
      </footer>
    </div>
  );
}
