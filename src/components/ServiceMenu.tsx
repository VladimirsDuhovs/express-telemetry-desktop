import React from "react";

interface ServiceMenuProps {
  services: { [key: string]: number };
  activeServices: string[];
  toggleService: (service: string) => void;
  getColorForService: (serviceName: string) => string;
}

const ServiceMenu: React.FC<ServiceMenuProps> = ({
  services,
  activeServices,
  toggleService,
  getColorForService,
}) => {
  return (
    <div className="service-menu">
      <h2>Services</h2>
      {Object.entries(services).map(([service, count]) => (
        <div
          key={service}
          className={`service-item ${activeServices.includes(service) ? "active" : ""}`}
          onClick={() => toggleService(service)}
        >
          <span
            className="service-name"
            style={{ color: getColorForService(service) }}
          >
            {service}
          </span>
          <span className="service-count">{count}</span>
        </div>
      ))}
    </div>
  );
};

export default ServiceMenu;
