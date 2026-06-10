import { glassTip, scrollToPage } from '../scrollBus'

const WINES = [
  {
    name: 'TERRA Tinto',
    vintage: '2022',
    price: '€28',
    notes: 'Touriga Nacional & Touriga Franca. Black plum, graphite, crushed violets. Fourteen months in old oak — the wood whispers, never shouts.',
    tip: 0.16,
  },
  {
    name: 'TERRA Branco',
    vintage: '2023',
    price: '€22',
    notes: 'Rabigato & Viosinho from the high plots at 520 metres. Citrus pith, wet stone, white blossom. Cold nights bottled.',
    tip: -0.16,
  },
  {
    name: 'TERRA Vintage Port',
    vintage: '2017',
    price: '€85',
    notes: 'A declared year. Fig, dark chocolate, orange peel and a finish that lasts a quarter of an hour. It will outlive us all.',
    tip: 0.22,
  },
]

export default function Interface() {
  return (
    <div className="interface">
      {/* 0 — Hero */}
      <section className="section section--center section--hero">
        <p className="tagline">Quinta Terra · Douro Valley · est. 1916</p>
        <h1 className="hero-title">
          Wine is geography
          <br />
          you can <em>drink</em>.
        </h1>
        <p className="hero-sub">
          Ninety hectares of terraced schist above the Douro.
          <br />
          Four generations. Three wines. One river.
        </p>
        <button className="cta" onClick={() => scrollToPage(1)}>
          Walk the terraces ↓
        </button>
        <div className="scroll-hint">
          <span className="scroll-hint__line" />
          <span className="scroll-hint__label">scroll</span>
        </div>
      </section>

      {/* 1 — Terroir */}
      <section className="section section--left" data-num="01">
        <p className="kicker">01 — Terroir</p>
        <h2>
          Schist soil. 41° slopes.
          <br />
          <em>Stubborn</em> vines.
        </h2>
        <p className="body">
          Our roots dig six metres down through fractured schist to find water — the struggle
          is the flavour. The terraces were cut by hand in 1916 and they still hold every
          last drop of evening sun.
        </p>
        <p className="hint">→ hover the plot markers</p>
      </section>

      {/* 2 — The Wines */}
      <section className="section section--left section--wines" data-num="02">
        <p className="kicker">02 — The Wines</p>
        <h2>
          Three wines.
          <br />
          One <em>hillside</em>.
        </h2>
        <ul className="wines">
          {WINES.map((w) => (
            <li
              key={w.name}
              className="wine-card"
              onMouseEnter={() => {
                glassTip.target = w.tip
              }}
              onMouseLeave={() => {
                glassTip.target = 0
              }}
            >
              <h3>
                {w.name} <span className="wine-card__vintage">{w.vintage}</span>
              </h3>
              <p className="wine-card__price">{w.price}</p>
              <p className="wine-card__notes">{w.notes}</p>
            </li>
          ))}
        </ul>
        <p className="hint">→ hover a wine — watch the glass</p>
      </section>

      {/* 3 — The Cellar */}
      <section className="section section--right" data-num="03">
        <p className="kicker">03 — The Cellar</p>
        <h2>
          1,200 barrels. 14°C.
          <br />
          Absolute <em>silence</em>.
        </h2>
        <p className="body">
          Cut into the granite behind the house, the cellar has not changed temperature in a
          hundred years. The wine sleeps here for fourteen months and we tiptoe around it.
        </p>
        <p className="hint">→ hover a barrel</p>
      </section>

      {/* 4 — Harvest */}
      <section className="section section--center" data-num="04">
        <p className="kicker">04 — Harvest</p>
        <h2>
          Picked by hand.
          <br />
          Trodden by <em>foot</em>.
        </h2>
        <div className="stats">
          <div>
            <strong>90</strong>
            <span>hectares</span>
          </div>
          <div>
            <strong>110</strong>
            <span>years</span>
          </div>
          <div>
            <strong>4</strong>
            <span>generations</span>
          </div>
        </div>
        <p className="hint">→ click the grapes</p>
      </section>

      {/* 5 — Visit */}
      <section className="section section--center" data-num="05">
        <p className="kicker">05 — Visit</p>
        <h2>
          Tastings at <em>golden hour</em>.
        </h2>
        <p className="body">
          Booking required. Six guests at a time, on the terrace, as the sun drops behind the
          far ridge. Bring nothing but time.
        </p>
        <a className="cta cta--big" href="mailto:visit@quintaterra.pt">
          visit@quintaterra.pt
        </a>
        <p className="visit-address">
          Quinta Terra · EN-222, km 41 · 5110-204 Armamar · Douro, Portugal
        </p>
      </section>

      {/* 6 — Footer: split editorial — quinta map on sand / contact on plum */}
      <section className="footer-section">
        <div className="footer-map">
          <p className="footer-map__title">The Quinta — plan of the estate</p>
          <div className="map-canvas" aria-hidden="true">
            <div className="map-river" />
            <div className="map-river map-river--bank" />
            <div className="map-plot map-plot--a">
              <span>A</span>
              <small>Vinha Velha</small>
            </div>
            <div className="map-plot map-plot--b">
              <span>B</span>
              <small>Schist Ridge</small>
            </div>
            <div className="map-plot map-plot--c">
              <span>C</span>
              <small>River Bend</small>
            </div>
            <div className="map-house">⌂</div>
            <div className="map-north">N</div>
            <div className="map-river-label">Rio Douro →</div>
          </div>
          <p className="footer-map__legend">
            A — Vinha Velha, 1916 · B — Schist Ridge, 41° · C — River Bend, old Rabigato
          </p>
        </div>

        <div className="footer-info">
          <p className="footer-quote">“The valley does the work. We just listen.”</p>

          <div className="footer-grid">
            <div className="footer-block">
              <h4>Find us</h4>
              <p>
                Quinta Terra
                <br />
                EN-222, km 41
                <br />
                5110-204 Armamar
                <br />
                Douro, Portugal
              </p>
            </div>
            <div className="footer-block">
              <h4>Talk to us</h4>
              <p>
                <a href="tel:+351254920116">+351 254 920 116</a>
                <br />
                <a href="mailto:visit@quintaterra.pt">visit@quintaterra.pt</a>
              </p>
            </div>
            <div className="footer-block">
              <h4>Opening hours</h4>
              <p>
                Apr–Oct: Thu–Sun, 16:00–20:00
                <br />
                Nov–Mar: by appointment
              </p>
            </div>
          </div>

          <div className="footer-awards">
            <span>Decanter Gold ’24</span>
            <i>·</i>
            <span>IWC Silver ’25</span>
            <i>·</i>
            <span>Wine Spectator 93pts</span>
          </div>
        </div>

        <div className="footer-strip">
          <span>© Quinta Terra 1916–2026</span>
          <span>Drink responsibly — Douro, Portugal</span>
        </div>
      </section>
    </div>
  )
}
