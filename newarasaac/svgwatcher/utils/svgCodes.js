const pluralSVGCode =
  '\n<rect x="390" y="147" style="fill:#FFFFFF;" width="55" height="55"/>\n<line style="fill:none;stroke:#000000;stroke-width:16.6297;" x1="417.6" y1="149.5" x2="417.6" y2="199.5"/>\n<line style="fill:none;stroke:#000000;stroke-width:16.6297;" x1="392.5" y1="174.7" x2="442.5" y2="174.7"/>'
const futureSVGCode =
  '\n<rect x="390" y="147" style="fill:#FFFFFF;" width="55" height="55"/>\n<line style="fill:none;stroke:#000000;stroke-width:12;" x1="393.1" y1="174.7" x2="423.5" y2="174.7"/>\n<polygon points="413,156.9 413,192.1 443,174.5"/>'
const pastSVGCode =
  '\n<rect x="-55" y="147" style="fill:#FFFFFF;" width="55" height="55"/>\n<line style="fill:none;stroke:#000000;stroke-width:12;" x1="-33.5" y1="174.7" x2="-3.1" y2="174.7"/>\n<polygon points="-53,174.5 -23,192.1 -23,156.9"/>'

const classroom = {
  right: `<rect id="fondo_x5F_55x55" x="390" y="147" style="fill:#FFFFFF;" width="55" height="55"/>
          <g id="contorno_x5F_aula">
            <rect x="392.7" y="149.4" style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" width="50" height="50"/>
            <g>
              <g>
                <line style="fill:none;stroke:#000000;stroke-width:3.2892;stroke-linecap:round;stroke-miterlimit:3.8637;" x1="400.1" y1="157.2" x2="400.1" y2="192"/>
                <polyline style="fill:none;stroke:#000000;stroke-width:3.2892;stroke-linecap:round;stroke-miterlimit:3.8637;" points="400.5,176.3 415.9,176.3 415.9,192"/>
              </g>
              <line style="fill:none;stroke:#000000;stroke-width:3.2892;stroke-linecap:round;stroke-miterlimit:3.8637;" x1="409" y1="166.5" x2="435.4" y2="166.5"/>
              <path style="fill:none;stroke:#000000;stroke-width:3.2892;stroke-linecap:round;stroke-miterlimit:3.8637;" d="M414.6,168.7h13.9c0,0,4.9-0.2,4.9,4.9s0,13.7,0,13.7s0.1,3.5-3.5,3.5s-7.2,0-7.2,0"/>
            </g>
          </g>`,
  left: `<rect id="fondo_x5F_55x55_1_" x="-55.5" y="147" style="fill:#FFFFFF;" width="55" height="55" />
          <g id="contorno_x5F_aula">
            <rect x="-52.5" y="149.2" style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" width="50" height="50" />
            <g>
              <g>
                <line style="fill:none;stroke:#000000;stroke-width:3.2892;stroke-linecap:round;stroke-miterlimit:3.8637;" x1="-45.1" y1="157" x2="-45.1" y2="191.8" />
                <polyline style="fill:none;stroke:#000000;stroke-width:3.2892;stroke-linecap:round;stroke-miterlimit:3.8637;" points="-44.7,176.1 -29.3,176.1 -29.3,191.8" />
              </g>
              <line style="fill:none;stroke:#000000;stroke-width:3.2892;stroke-linecap:round;stroke-miterlimit:3.8637;" x1="-36.2" y1="166.3" x2="-9.8" y2="166.3" />
              <path style="fill:none;stroke:#000000;stroke-width:3.2892;stroke-linecap:round;stroke-miterlimit:3.8637;" d="M-30.6,168.5h13.9c0,0,4.9-0.2,4.9,4.9s0,13.7,0,13.7s0.1,3.5-3.5,3.5s-7.2,0-7.2,0" />
            </g>
          </g>`
}

const library = {
  right: `<rect id="fondo_x5F_55x55" x="390" y="147" style="fill:#FFFFFF;" width="55" height="55"/>
          <g id="contorno_x5F_biblioteca">
            <rect x="392.7" y="149.4" style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" width="50" height="50"/>
            <g>
              <path style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" d="M415.9,163.6c0,0-3,0.6-6.1-0.6v31.5c2.9,1.6,6.1,0.8,6.1,0.8V163.6z"/>
              <polyline style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" points="415.7,163.9 429.1,154.1 429.1,185.3 416,195.4 			"/>
              <line style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" x1="415.9" y1="163.7" x2="409.6" y2="162.7"/>
              <path style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" d="M409.7,173c3.1,1.2,6.1,0.6,6.1,0.6"/>
              <path style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" d="M415.9,167.8c0,0-3,0.6-6.1-0.6"/>
              <path style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" d="M429.3,153.8c0,0-4.1,1.3-6.4-0.8"/>
              <line style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" x1="423.7" y1="152.9" x2="409.6" y2="162.7"/>
            </g>
          </g>`,
  left: `<rect id="fondo_x5F_55x55" x="-55.5" y="147" style="fill:#FFFFFF;" width="55" height="55"/>
          <g id="contorno_x5F_biblioteca">
            <rect x="-52.5" y="149.2" style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" width="50" height="50"/>
            <g>
              <path style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" d="M-29.3,163.4c0,0-3,0.6-6.1-0.6v31.5c2.9,1.6,6.1,0.8,6.1,0.8V163.4z"/>
              <polyline style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" points="-29.5,163.7 -16.1,153.9 -16.1,185.1 -29.2,195.2 			"/>
              <line style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" x1="-29.3" y1="163.5" x2="-35.6" y2="162.5"/>
              <path style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" d="M-35.5,172.8c3.1,1.2,6.1,0.6,6.1,0.6"/>
              <path style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" d="M-29.3,167.6c0,0-3,0.6-6.1-0.6"/>
              <path style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" d="M-15.9,153.6c0,0-4.1,1.3-6.4-0.8"/>
              <line style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" x1="-21.5" y1="152.7" x2="-35.6" y2="162.5"/>
            </g>
          </g>`
}

const office = {
  right: `<rect id="fondo_x5F_55x55" x="390" y="147" style="fill:#FFFFFF;" width="55" height="55"/>
          <g id="contorno_x5F_oficina">
            <rect x="392.7" y="149.4" style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" width="50" height="50"/>
            <g>
              <g>
                <g>
                  <path d="M417.8,152.1c-1.2,0.2-2,0.7-2.7,1.9c-0.7,1.2-1,2.5-0.8,4c0.3,1.4,0.9,2.6,2,3.5c0.3,0.2,0.5,0.5,0.8,0.6
                    c0.8,0.4,1.6,0.6,2.5,0.4c1.1-0.2,2-0.8,2.7-1.9c0,0,0.1-0.1,0.1-0.2c0.7-1.2,0.7-2.5,0.4-3.9c-0.2-1.4-0.8-2.4-1.9-3.4
                    C419.9,152.1,419,151.8,417.8,152.1z"/>
                  <path d="M414.4,156.8c0,0,4.9-1.3,5.8-3.3c0.7,1.5,2.1,1.5,2.1,1.5s-0.8-2.7-3.9-2.8C414.6,152.1,414.4,156.8,414.4,156.8z"/>
                  <path d="M417.7,162.3c0,0,2.8,0.6,3.6-0.5c0.1,0.6,0.2,0.4,0.2,0.4l-1.5,3.3l-1.6-2.2L417.7,162.3z"/>
                </g>
                <polygon points="396.1,173.7 439,173.7 439,195.7 434.3,195.7 434.3,187.7 402.1,187.6 402.1,195.7 396.1,195.7"/>
                <polygon points="411.1,187.7 409.1,194.4 409.9,194.5 411.9,187.7"/>
                <polygon points="429.9,187.7 431.9,194.4 431.1,194.5 429.1,187.7"/>
                <path d="M419.5,173.8c2.8,0,4.7,0,4.7,0l6,0.1c0,0,1.8-2.6,0.3-4.5c-1.9-3.2-4.2-5.8-4.2-5.8s-3.3-2.1-4.4-1.7
                  c-1,1.3-1.5,3.4-1.5,3.4"/>
                <path d="M421.9,161.6c0,0-1.5,0-2.8,0.1c-1-0.5-4.4,1.7-4.4,1.7s-2.3,2.6-4.2,5.8c-1.5,1.9,0.3,4.5,0.3,4.5l6-0.1
                  c0,0,1.9,0,3.8-0.1"/>
                <polygon points="432.8,168.4 433.4,173.4 436.5,173.5 437.2,168.4"/>
                <path d="M414.2,187.7l-1.5,5.6l1.1,0.3c0,0,0.8,2.6,2.1,2.6c1.5-0.3,1.9-1.2,2.6-2.6c0.8,0.4,0.8,0.4,0.8,0.4l0.4-6L414.2,187.7
                  z"/>
                <path d="M421.1,187.9h6.1l1,6h-0.8c0,0,0.4,3.1-2.8,2.4c-1.3-1.3-1.3-2.4-1.3-2.4h-1.5L421.1,187.9z"/>
              </g>
              <g>
                <polygon points="433.1,168.4 430.7,162.5 431.2,162.2 433.6,168.3"/>
                <polygon points="434.2,168.4 433.7,165.5 434.2,165.2 434.7,168.3"/>
                <polygon points="435.8,168.4 436.3,165.5 435.7,165.2 435.2,168.3"/>
                <polygon points="436.9,168.4 437.8,164.7 437.2,164.5 436.3,168.3"/>
              </g>
              <g>
                <path d="M396.8,173.2l-0.9-1.1c0,0,2.5,1.2,9.7,0.7c0,0.5,0,0.5,0,0.5L396.8,173.2z"/>
                <path d="M407.3,172.2l0.9,1.1c0,0-2.5-1.2-9.7-0.7c0-0.5,0-0.5,0-0.5L407.3,172.2z"/>
                <path d="M396.8,171.7l-0.9-1.1c0,0,2.5,1.2,9.7,0.7c0,0.5,0,0.5,0,0.5L396.8,171.7z"/>
                <path d="M407.3,170.6l0.9,1.1c0,0-2.5-1.2-9.7-0.7c0-0.5,0-0.5,0-0.5L407.3,170.6z"/>
                <path d="M396.8,170.2l-0.9-1.1c0,0,2.5,1.2,9.7,0.7c0,0.5,0,0.5,0,0.5L396.8,170.2z"/>
                <path d="M407.3,169.1l0.9,1.1c0,0-2.5-1.2-9.7-0.7c0-0.5,0-0.5,0-0.5L407.3,169.1z"/>
                <path d="M396.8,168.7l-0.9-1.1c0,0,2.5,1.2,9.7,0.7c0,0.5,0,0.5,0,0.5L396.8,168.7z"/>
              </g>
              <polygon style="fill:none;stroke:#000000;stroke-width:0.6409;stroke-miterlimit:3.8637;" points="396.1,173.7 439,173.7 439,195.7 434.3,195.7 434.3,187.7 402.1,187.6 402.1,195.7 396.1,195.7"/>
              <g>
                <path style="fill:none;stroke:#000000;stroke-width:0.6409;stroke-miterlimit:3.8637;" d="M414.4,156.8c0,0,4.9-1.3,5.8-3.3c0.7,1.5,2.1,1.5,2.1,1.5s-0.8-2.7-3.9-2.8
                  C414.6,152.1,414.4,156.8,414.4,156.8z"/>
                <path style="fill:none;stroke:#000000;stroke-width:0.6409;stroke-miterlimit:3.8637;" d="M422.3,155.1c0.2,0.5,0.4,1,0.5,1.6c0.5,2.8-0.9,5.4-3.2,5.8c-2.3,0.4-4.6-1.4-5.1-4.2
                  c-0.1-0.4-0.1-0.9-0.1-1.3"/>
                <path style="fill:none;stroke:#000000;stroke-width:0.6409;stroke-miterlimit:3.8637;" d="M414.1,187.6l-1,5.8l1.1,0.2c0,0-0.2,1.7,1.4,2.2c1.6,0.5,2.8-1,2.8-2.2c1,0.2,1,0.2,1,0.2l0.3-6.1h1.6
                  l0.8,6.1l1.4,0.2c0,0-0.1,2.4,1.4,2.4c1.4,0,2.5,0.1,2.5-2.3c0-0.2,0.9,0,0.8-0.2c-0.4-1.5-0.6-4.4-1.1-6.2"/>
                <polygon style="fill:none;stroke:#000000;stroke-width:0.6409;stroke-miterlimit:3.8637;" points="411.1,187.7 409.1,194.4 409.9,194.5 411.9,187.7"/>
                <polygon style="fill:none;stroke:#000000;stroke-width:0.6409;stroke-miterlimit:3.8637;" points="429.9,187.7 431.9,194.4 431.1,194.5 429.1,187.7"/>
              </g>
            </g>
          </g>`,
  left: `<rect id="fondo_x5F_55x55_1_" x="-55.5" y="147" style="fill:#FFFFFF;" width="55" height="55"/>
          <g id="contorno_x5F_oficina">
            <rect x="-52.5" y="149.2" style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:3.8637;" width="50" height="50"/>
            <g>
              <g>
                <g>
                  <path d="M-27.4,151.9c-1.2,0.2-2,0.7-2.7,1.9c-0.7,1.2-1,2.5-0.8,4c0.3,1.4,0.9,2.6,2,3.5c0.3,0.2,0.5,0.5,0.8,0.6
                    c0.8,0.4,1.6,0.6,2.5,0.4c1.1-0.2,2-0.8,2.7-1.9c0,0,0.1-0.1,0.1-0.2c0.7-1.2,0.7-2.5,0.4-3.9c-0.2-1.4-0.8-2.4-1.9-3.4
                    C-25.3,151.9-26.2,151.6-27.4,151.9z"/>
                  <path d="M-30.8,156.6c0,0,4.9-1.3,5.8-3.3c0.7,1.5,2.1,1.5,2.1,1.5s-0.8-2.7-3.9-2.8C-30.6,151.9-30.8,156.6-30.8,156.6z"/>
                  <path d="M-27.5,162.1c0,0,2.8,0.6,3.6-0.5c0.1,0.6,0.2,0.4,0.2,0.4l-1.5,3.3l-1.6-2.2L-27.5,162.1z"/>
                </g>
                <polygon points="-49.1,173.5 -6.2,173.5 -6.2,195.5 -10.9,195.5 -10.9,187.5 -43.1,187.4 -43.1,195.5 -49.1,195.5"/>
                <polygon points="-34.1,187.5 -36.1,194.2 -35.3,194.3 -33.3,187.5"/>
                <polygon points="-15.3,187.5 -13.3,194.2 -14.1,194.3 -16.1,187.5"/>
                <path d="M-25.7,173.6c2.8,0,4.7,0,4.7,0l6,0.1c0,0,1.8-2.6,0.3-4.5c-1.9-3.2-4.2-5.8-4.2-5.8s-3.3-2.1-4.4-1.7
                  c-1,1.3-1.5,3.4-1.5,3.4"/>
                <path d="M-23.3,161.4c0,0-1.5,0-2.8,0.1c-1-0.5-4.4,1.7-4.4,1.7s-2.3,2.6-4.2,5.8c-1.5,1.9,0.3,4.5,0.3,4.5l6-0.1
                  c0,0,1.9,0,3.8-0.1"/>
                <polygon points="-12.4,168.2 -11.8,173.2 -8.7,173.3 -8,168.2"/>
                <path d="M-31,187.5l-1.5,5.6l1.1,0.3c0,0,0.8,2.6,2.1,2.6c1.5-0.3,1.9-1.2,2.6-2.6c0.8,0.4,0.8,0.4,0.8,0.4l0.4-6L-31,187.5z"/>
                <path d="M-24.1,187.7h6.1l1,6h-0.8c0,0,0.4,3.1-2.8,2.4c-1.3-1.3-1.3-2.4-1.3-2.4h-1.5L-24.1,187.7z"/>
              </g>
              <g>
                <polygon points="-12.1,168.2 -14.5,162.3 -14,162 -11.6,168.1"/>
                <polygon points="-11,168.2 -11.5,165.3 -11,165 -10.5,168.1"/>
                <polygon points="-9.4,168.2 -8.9,165.3 -9.5,165 -10,168.1"/>
                <polygon points="-8.3,168.2 -7.4,164.5 -8,164.3 -8.9,168.1"/>
              </g>
              <g>
                <path d="M-48.4,173l-0.9-1.1c0,0,2.5,1.2,9.7,0.7c0,0.5,0,0.5,0,0.5L-48.4,173z"/>
                <path d="M-37.9,172l0.9,1.1c0,0-2.5-1.2-9.7-0.7c0-0.5,0-0.5,0-0.5L-37.9,172z"/>
                <path d="M-48.4,171.5l-0.9-1.1c0,0,2.5,1.2,9.7,0.7c0,0.5,0,0.5,0,0.5L-48.4,171.5z"/>
                <path d="M-37.9,170.4l0.9,1.1c0,0-2.5-1.2-9.7-0.7c0-0.5,0-0.5,0-0.5L-37.9,170.4z"/>
                <path d="M-48.4,170l-0.9-1.1c0,0,2.5,1.2,9.7,0.7c0,0.5,0,0.5,0,0.5L-48.4,170z"/>
                <path d="M-37.9,168.9l0.9,1.1c0,0-2.5-1.2-9.7-0.7c0-0.5,0-0.5,0-0.5L-37.9,168.9z"/>
                <path d="M-48.4,168.5l-0.9-1.1c0,0,2.5,1.2,9.7,0.7c0,0.5,0,0.5,0,0.5L-48.4,168.5z"/>
              </g>
              <polygon style="fill:none;stroke:#000000;stroke-width:0.6409;stroke-miterlimit:3.8637;" points="-49.1,173.5 -6.2,173.5 -6.2,195.5 -10.9,195.5 -10.9,187.5 -43.1,187.4 -43.1,195.5 -49.1,195.5"/>
              <g>
                <path style="fill:none;stroke:#000000;stroke-width:0.6409;stroke-miterlimit:3.8637;" d="M-30.8,156.6c0,0,4.9-1.3,5.8-3.3c0.7,1.5,2.1,1.5,2.1,1.5s-0.8-2.7-3.9-2.8
                  C-30.6,151.9-30.8,156.6-30.8,156.6z"/>
                <path style="fill:none;stroke:#000000;stroke-width:0.6409;stroke-miterlimit:3.8637;" d="M-22.9,154.9c0.2,0.5,0.4,1,0.5,1.6c0.5,2.8-0.9,5.4-3.2,5.8c-2.3,0.4-4.6-1.4-5.1-4.2
                  c-0.1-0.4-0.1-0.9-0.1-1.3"/>
                <path style="fill:none;stroke:#000000;stroke-width:0.6409;stroke-miterlimit:3.8637;" d="M-31.1,187.4l-1,5.8l1.1,0.2c0,0-0.2,1.7,1.4,2.2c1.6,0.5,2.8-1,2.8-2.2c1,0.2,1,0.2,1,0.2l0.3-6.1h1.6
                  l0.8,6.1l1.4,0.2c0,0-0.1,2.4,1.4,2.4c1.4,0,2.5,0.1,2.5-2.3c0-0.2,0.9,0,0.8-0.2c-0.4-1.5-0.6-4.4-1.1-6.2"/>
                <polygon style="fill:none;stroke:#000000;stroke-width:0.6409;stroke-miterlimit:3.8637;" points="-34.1,187.5 -36.1,194.2 -35.3,194.3 -33.3,187.5"/>
                <polygon style="fill:none;stroke:#000000;stroke-width:0.6409;stroke-miterlimit:3.8637;" points="-15.3,187.5 -13.3,194.2 -14.1,194.3 -16.1,187.5"/>
              </g>
            </g>
          </g>`
}

const health = {
  right: `<rect id="fondo_x5F_55x55" x="390" y="147" style="fill:#FFFFFF;" width="55" height="55"/>
          <polygon id="cruz_x5F_color" style="fill:#E01307;" points="400.2,168.7 411.7,168.7 411.7,157.2 423.2,157.2 423.2,168.7 434.7,168.7 
            434.7,180.2 423.2,180.2 423.2,191.7 411.7,191.7 411.7,180.2 400.2,180.2"/>
          <g id="contorno_x5F_cruz">
            <polygon style="fill:none;stroke:#000000;stroke-width:1.7358;stroke-miterlimit:3.8637;" points="400.2,168.7 411.7,168.7 411.7,157.2 423.2,157.2 423.2,168.7 434.7,168.7 434.7,180.2 423.2,180.2 
            423.2,191.7 411.7,191.7 411.7,180.2 400.2,180.2"/>
            <circle style="fill:none;stroke:#000000;stroke-width:2.3145;stroke-miterlimit:3.8637;" cx="417.4" cy="174.4" r="25.1"/>
          </g>`,
  left: `<rect id="fondo_x5F_55x55" x="-55.5" y="147" style="fill:#FFFFFF;" width="55" height="55"/>
          <polygon id="cruz_x5F_color" style="fill:#E01307;" points="-45,168.5 -33.5,168.5 -33.5,157 -22,157 -22,168.5 -10.5,168.5 -10.5,180 
            -22,180 -22,191.5 -33.5,191.5 -33.5,180 -45,180"/>
          <g id="contorno_x5F_cruz">
            <polygon style="fill:none;stroke:#000000;stroke-width:1.7358;stroke-miterlimit:3.8637;" points="-45,168.5 -33.5,168.5 -33.5,157 -22,157 -22,168.5 -10.5,168.5 -10.5,180 -22,180 -22,191.5 
            -33.5,191.5 -33.5,180 -45,180"/>
            <circle style="fill:none;stroke:#000000;stroke-width:2.3145;stroke-miterlimit:3.8637;" cx="-27.8" cy="174.2" r="25.1"/>
          </g>`
}

const healthBN = {
  right: `<rect id="fondo_x5F_55x55" x="390" y="147" style="fill:#FFFFFF;" width="55" height="55"/>
          <polygon id="cruz_x5F_color" style="fill:#000000;" points="400.2,168.7 411.7,168.7 411.7,157.2 423.2,157.2 423.2,168.7 434.7,168.7 
            434.7,180.2 423.2,180.2 423.2,191.7 411.7,191.7 411.7,180.2 400.2,180.2"/>
          <g id="contorno_x5F_cruz">
            <polygon style="fill:none;stroke:#000000;stroke-width:1.7358;stroke-miterlimit:3.8637;" points="400.2,168.7 411.7,168.7 411.7,157.2 423.2,157.2 423.2,168.7 434.7,168.7 434.7,180.2 423.2,180.2 
            423.2,191.7 411.7,191.7 411.7,180.2 400.2,180.2"/>
            <circle style="fill:none;stroke:#000000;stroke-width:2.3145;stroke-miterlimit:3.8637;" cx="417.4" cy="174.4" r="25.1"/>
          </g>`,
  left: `<rect id="fondo_x5F_55x55" x="-55.5" y="147" style="fill:#FFFFFF;" width="55" height="55"/>
          <polygon id="cruz_x5F_color" style="fill:#000000;" points="-45,168.5 -33.5,168.5 -33.5,157 -22,157 -22,168.5 -10.5,168.5 -10.5,180 
            -22,180 -22,191.5 -33.5,191.5 -33.5,180 -45,180"/>
          <g id="contorno_x5F_cruz">
            <polygon style="fill:none;stroke:#000000;stroke-width:1.7358;stroke-miterlimit:3.8637;" points="-45,168.5 -33.5,168.5 -33.5,157 -22,157 -22,168.5 -10.5,168.5 -10.5,180 -22,180 -22,191.5 
            -33.5,191.5 -33.5,180 -45,180"/>
            <circle style="fill:none;stroke:#000000;stroke-width:2.3145;stroke-miterlimit:3.8637;" cx="-27.8" cy="174.2" r="25.1"/>
          </g>`
}

const identitySVGCode = {
  classroom,
  office,
  library,
  health
}

const identityBNSVGCode = {
  classroom,
  office,
  library,
  health: healthBN
}

module.exports = {
  pluralSVGCode,
  pastSVGCode,
  futureSVGCode,
  identitySVGCode,
  identityBNSVGCode
}
