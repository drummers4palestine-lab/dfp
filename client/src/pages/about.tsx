import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Users, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        <div className="text-center mb-8 md:mb-12">
          <div className="relative mb-6 md:mb-8">
            <img 
              src="/logo.png" 
              alt="Drummers For Palestine" 
              className="w-32 md:w-48 lg:w-64 h-auto mx-auto object-contain drop-shadow-2xl" 
            />
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-green-500/20 rounded-full blur-3xl"></div>
          </div>
          <h1 className="street-text font-bold text-3xl md:text-4xl lg:text-5xl mb-4 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
            Who We Are
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We are a collective of passionate drummers united by a shared purpose
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-16">
          <p className="text-lg text-gray-300 mb-6">
            We are a collective of passionate drummers united by a shared purpose:
            to amplify the Palestinian movement and raise morale through the power of rhythm.
            Our beats echo in the streets, providing a rallying call for justice, solidarity, and resistance.
          </p>
          
          <h2 className="street-text font-bold text-2xl mb-6">Our Code of Conduct</h2>
          <p className="text-lg text-gray-300 mb-6">
            As members of MD4P, we commit to the following guiding principles:
          </p>
          
          <ul className="text-lg text-gray-300 space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-white mt-1 flex-shrink-0" />
              We treat others how we want to be treated—both in person and online.
              We act with kindness and respect, fostering an inclusive space for all.
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-white mt-1 flex-shrink-0" />
              We remain mindful of how our tone or phrasing might impact others,
              striving for open and constructive dialogue.
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-white mt-1 flex-shrink-0" />
              We challenge any oppressive behavior (sexism, racism, homophobia) in ourselves and others,
              aiming to keep the group safe and welcoming.
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-white mt-1 flex-shrink-0" />
              We commit to using protective equipment (like ear protection) during events,
              and encourage others to do the same.
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-white mt-1 flex-shrink-0" />
              If approached about our behavior, we stay open and reflective on how to improve.
            </li>
          </ul>
          
          <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-white">
            <p className="text-xl font-bold text-white mb-2">
              "Our mission is to amplify the Palestinian movement and raise morale."
            </p>
            <p className="text-lg text-gray-300">
              We invite everyone to join our percussive purpose. 
              We bring thunder in the streets until Palestine is free!
            </p>
          </div>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <h3 className="street-text font-bold text-2xl mb-4">Join Our Percussive Purpose</h3>
            <p className="text-lg text-gray-300 mb-6">
              Learn samba rhythms, participate in solidarity actions, and help amplify the Palestinian movement through music.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
