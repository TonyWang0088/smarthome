import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Calendar, MapPin, Star, Car, Flame, TreePine, Dumbbell } from "lucide-react";
import { Property } from "@shared/schema";
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';

interface PropertyModalProps {
  property: Property;
  onClose: () => void;
}

export default function PropertyModal({ property, onClose }: PropertyModalProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, dragFree: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getFeatureIcon = (feature: string) => {
    const lowerFeature = feature.toLowerCase();
    if (lowerFeature.includes('garage') || lowerFeature.includes('car')) {
      return <Car size={16} className="text-primary" />;
    }
    if (lowerFeature.includes('fireplace')) {
      return <Flame size={16} className="text-primary" />;
    }
    if (lowerFeature.includes('yard') || lowerFeature.includes('garden')) {
      return <TreePine size={16} className="text-primary" />;
    }
    if (lowerFeature.includes('gym')) {
      return <Dumbbell size={16} className="text-primary" />;
    }
    return <div className="w-4 h-4 bg-primary rounded-full" />;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary">
            Property Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="embla overflow-hidden rounded-lg" ref={emblaRef}>
              <div className="embla__container">
                {property.images.map((image, index) => (
                  <div key={index} className="embla__slide flex-[0_0_100%] min-w-0">
                    <img
                      src={image}
                      alt={`Property view ${index + 1}`}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            {property.images.length > 1 && (
              <div className="embla-thumbs">
                <div className="embla-thumbs__container">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`embla-thumbs__slide ${index === selectedIndex ? 'opacity-100' : 'opacity-50'}`}
                      onClick={() => scrollTo(index)}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Property Information */}
          <div className="space-y-6">
            <div>
              <h4 className="text-3xl font-bold text-secondary mb-2">
                {formatPrice(property.price)}
              </h4>
              <p className="text-gray-600 mb-2">
                {property.bedroom} bd | {property.bathrooms} ba | {property.squareFeet.toLocaleString()} sqft
              </p>
              <p className="text-gray-800">
                {property.address}, {property.city}, {property.province} {property.postalCode}
              </p>
              <div className="flex items-center mt-2 space-x-4">
                <span className="flex items-center text-sm text-gray-500">
                  <MapPin className="mr-1" size={14} />
                  {property.neighborhood}
                </span>
                <span className="flex items-center text-sm text-gray-500">
                  <Star className="mr-1 text-yellow-400" size={14} fill="currentColor" />
                  {property.rating}
                </span>
              </div>
            </div>

            {/* Key Features */}
            <div>
              <h5 className="font-semibold text-lg mb-3">Key Features</h5>
              <div className="grid grid-cols-2 gap-3">
                {property.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {getFeatureIcon(feature)}
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Property Description */}
            <div>
              <h5 className="font-semibold text-lg mb-3">Description</h5>
              <p className="text-gray-700 text-sm leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Property Details */}
            <div>
              <h5 className="font-semibold text-lg mb-3">Property Details</h5>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Property Type:</span>
                  <span className="ml-2 capitalize">{property.propertyType}</span>
                </div>
                {property.yearBuilt && (
                  <div>
                    <span className="text-gray-500">Year Built:</span>
                    <span className="ml-2">{property.yearBuilt}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Days on Market:</span>
                  <span className="ml-2">{property.daysOnMarket} days</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 capitalize">{property.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Contact Buttons */}
            <div className="flex space-x-3">
              <Button className="flex-1 bg-primary hover:bg-blue-700">
                <Phone className="mr-2" size={16} />
                Call Agent
              </Button>
              <Button variant="outline" className="flex-1 border-primary text-primary hover:bg-blue-50">
                <Calendar className="mr-2" size={16} />
                Schedule Tour
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
