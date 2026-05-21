import { memo } from 'react'
import { SERVICES } from '@/data/homeCatalog'

function ServicesSectionComponent() {
  return (
    <section className="home-services">
      {SERVICES.map((service) => (
        <div key={service.title} className="home-service">
          <h3>{service.title}</h3>
          <p>{service.desc}</p>
        </div>
      ))}
    </section>
  )
}

export const ServicesSection = memo(ServicesSectionComponent)
