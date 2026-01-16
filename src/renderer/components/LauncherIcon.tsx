import React from "react";

interface LauncherIconProps {
  launcher: string;
  size?: number;
  className?: string;
}

export const LauncherIcon: React.FC<LauncherIconProps> = ({
  launcher,
  size = 24,
  className,
}) => {
  const getLauncherIcon = () => {
    switch (launcher.toLowerCase()) {
      case "modrinth":
        return (
          <svg
            width={size}
            height={size}
            fill="none"
            strokeLinejoin="round"
            strokeMiterlimit="2"
            viewBox="0 0 593 593"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g data-v-4efc4064="" fill="#1BD96A">
              <path
                d="m29 424.4 188.2-112.95-17.15-45.48 53.75-55.21 67.93-14.64 19.67 24.21-31.32 31.72-27.3 8.6-19.52 20.05 9.56 26.6 19.4 20.6 27.36-7.28 19.47-21.38 42.51-13.47 12.67 28.5-43.87 53.78-73.5 23.27-32.97-36.7L55.06 467.94C46.1 456.41 35.67 440.08 29 424.4Zm543.03-230.25-149.5 40.32c8.24 21.92 10.95 34.8 13.23 49l149.23-40.26c-2.38-15.94-6.65-32.17-12.96-49.06Z"
                data-v-4efc4064=""
              ></path>
              <path
                className="ring ring--large"
                d="M51.28 316.13c10.59 125 115.54 223.3 243.27 223.3 96.51 0 180.02-56.12 219.63-137.46l48.61 16.83c-46.78 101.34-149.35 171.75-268.24 171.75C138.6 590.55 10.71 469.38 0 316.13h51.28ZM.78 265.24C15.86 116.36 141.73 0 294.56 0c162.97 0 295.28 132.31 295.28 295.28 0 26.14-3.4 51.49-9.8 75.63l-48.48-16.78a244.28 244.28 0 0 0 7.15-58.85c0-134.75-109.4-244.15-244.15-244.15-124.58 0-227.49 93.5-242.32 214.11H.8Z"
                data-v-4efc4064=""
              ></path>
              <path
                className="ring ring--small"
                d="M293.77 153.17c-78.49.07-142.2 63.83-142.2 142.34 0 78.56 63.79 142.34 142.35 142.34 3.98 0 7.93-.16 11.83-.49l14.22 49.76a194.65 194.65 0 0 1-26.05 1.74c-106.72 0-193.36-86.64-193.36-193.35 0-106.72 86.64-193.35 193.36-193.35 2.64 0 5.28.05 7.9.16l-8.05 50.85Zm58.2-42.13c78.39 24.67 135.3 97.98 135.3 184.47 0 80.07-48.77 148.83-118.2 178.18l-14.17-49.55c48.08-22.85 81.36-71.89 81.36-128.63 0-60.99-38.44-113.07-92.39-133.32l8.1-51.15Z"
                data-v-4efc4064=""
              ></path>
            </g>
          </svg>
        );
      case "curseforge":
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#FFA500"
              d="m6.307 5.581.391 1.675H0s.112.502.167.558c.168.279.335.614.559.837 1.06 1.228 2.902 1.73 4.409 2.009 1.06.224 2.121.28 3.181.335l1.228 3.293h.67l.391 1.061h-.558l-.949 3.07h9.321l-.949-3.07h-.558l.39-1.061h.67s.558-3.404 2.288-4.967C21.935 7.758 24 7.535 24 7.535V5.581zm9.377 8.428c-.447.279-.949.279-1.284.503-.223.111-.335.446-.335.446-.223-.502-.502-.67-.837-.781-.335-.112-.949-.056-1.786-.782-.558-.502-.614-1.172-.558-1.507v-.167c0-.056 0-.112.056-.168.111-.334.39-.669.948-.893 0 0-.39.559 0 1.117.224.335.67.502 1.061.279.167-.112.279-.335.335-.503.111-.39.111-.781-.224-1.06-.502-.446-.613-1.06-.279-1.451 0 0 .112.502.614.446.335 0 .335-.111.224-.223-.056-.167-.782-1.228.279-2.009 0 0 .669-.447 1.451-.391-.447.056-.949.335-1.116.782v.055c-.168.447-.056.949.279 1.396.223.335.502.614.614 1.06-.168-.056-.279 0-.391.112a.53.53 0 0 0-.112.502c.056.112.168.223.279.223h.168c.167-.055.279-.279.223-.446.112.111.167.391.112.558 0 .167-.112.335-.168.446-.056.112-.167.224-.223.335s-.112.224-.112.335 0 .279.056.391c.223.335.67 0 .782-.279.167-.335.111-.726-.112-1.061 0 0 .391.224.67 1.005.223.67-.168 1.451-.614 1.73"
            />
          </svg>
        );
      case "prism":
        return (
          <svg
            width={size}
            height={size}
            version="1.1"
            viewBox="0 0 12.7 12.7"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g stroke-width=".26458">
              <g>
                <path
                  d="m6.35 0.52917-2.5208 4.3656 2.5208 1.4552 2.5203-1.4552 0.10955-3.0996c-1.1511-0.66459-2.3388-1.2661-2.6298-1.2661z"
                  fill="#df6277"
                />
                <path
                  d="m8.9798 1.7952-2.6298 4.5548 2.5203 1.4552 2.5208-4.3656c-0.14552-0.25205-1.2601-0.97975-2.4112-1.6443z"
                  fill="#fb9168"
                />
                <path
                  d="m11.391 3.4396-5.041 2.9104 2.5203 1.4552 2.7389-1.4552c0-1.3292-0.07255-2.6584-0.21808-2.9104z"
                  fill="#f3db6c"
                />
                <path
                  d="m6.35 6.35v2.9104h5.041c0.14552-0.25205 0.21807-1.5812 0.21808-2.9104z"
                  fill="#7ab392"
                />
                <path
                  d="m6.35 6.35v2.9104l2.6298 1.6443c1.1511-0.66459 2.2657-1.3923 2.4112-1.6443z"
                  fill="#4b7cbc"
                />
                <path
                  d="m6.35 6.35-2.5208 1.4552 2.5208 4.3656c0.29104 0 1.4787-0.60148 2.6298-1.2661z"
                  fill="#6f488c"
                />
                <path
                  d="m3.8292 4.8948-2.5203 4.3656c0.29104 0.5041 4.459 2.9104 5.041 2.9104v-5.8208z"
                  fill="#4d3f33"
                />
                <path
                  d="m1.309 3.4396c-0.29104 0.5041-0.29104 5.3167 0 5.8208l5.041-2.9104v-2.9104z"
                  fill="#7a573b"
                />
                <path
                  d="m6.35 0.52917c-0.58208-2e-8 -4.75 2.4063-5.041 2.9104l5.041 2.9104z"
                  fill="#99cd61"
                />
              </g>
              <path
                transform="matrix(.85338 0 0 .85338 .93132 .93123)"
                d="m6.3498 2.9393c-0.34105 0-2.7827 1.4099-2.9532 1.7052l2.9532 5.1157 2.9538-5.1157c-0.17052-0.29535-2.6127-1.7052-2.9538-1.7052z"
                fill="#fff"
              />
              <path
                transform="matrix(.88 0 0 .88 -10.906 -1.2421)"
                d="m16.746 6.9737 2.8639 4.9609c0.33073 0 2.6991-1.3672 2.8644-1.6536 0.16536-0.28642 0.16536-3.0209 0-3.3073l-2.8644 1.6536z"
                fill="#dfdfdf"
              />
              <path
                d="m3.8299 4.8948c-0.14551 0.25205-0.14553 2.6584 0 2.9104 0.14553 0.25204 2.2292 1.4552 2.5203 1.4552v-2.9104z"
                fill="#d6d2d2"
              />
            </g>
          </svg>
        );
      case "atlauncher":
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M256 32L96 160l160 288 160-288L256 32z" fill="#2DD4BF" />
            <path d="M256 160L160 320h192L256 160z" fill="#14B8A6" />
          </svg>
        );
      case "gdlauncher":
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="96"
              y="96"
              width="128"
              height="128"
              rx="16"
              fill="#10B981"
            />
            <rect
              x="288"
              y="96"
              width="128"
              height="128"
              rx="16"
              fill="#059669"
            />
            <rect
              x="96"
              y="288"
              width="128"
              height="128"
              rx="16"
              fill="#059669"
            />
            <rect
              x="288"
              y="288"
              width="128"
              height="128"
              rx="16"
              fill="#047857"
            />
          </svg>
        );
      case "technic":
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M256 32L96 448h320L256 32z" fill="#EF4444" />
            <path d="M256 160L176 384h160L256 160z" fill="#DC2626" />
          </svg>
        );
      case "ftb":
      case "feed the beast":
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="256" cy="256" r="192" fill="#F59E0B" />
            <path
              d="M256 128v256M128 256h256"
              stroke="#D97706"
              strokeWidth="32"
              strokeLinecap="round"
            />
          </svg>
        );
      default:
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="96"
              y="96"
              width="320"
              height="320"
              rx="32"
              fill="#6B7280"
            />
            <path
              d="M256 192v128M192 256h128"
              stroke="#9CA3AF"
              strokeWidth="32"
              strokeLinecap="round"
            />
          </svg>
        );
    }
  };

  const getLauncherName = () => {
    switch (launcher.toLowerCase()) {
      case "modrinth":
        return "Modrinth Launcher";
      case "curseforge":
        return "CurseForge";
      case "prism":
      case "prism launcher":
        return "Prism Launcher";
      case "atlauncher":
        return "ATLauncher";
      case "gdlauncher":
        return "GDLauncher";
      case "technic":
        return "Technic Launcher";
      case "ftb":
      case "feed the beast":
        return "Feed The Beast";
      default:
        return launcher;
    }
  };

  return (
    <div
      className={`inline-flex items-center ${className || ""}`}
      title={getLauncherName()}
    >
      {getLauncherIcon()}
    </div>
  );
};
