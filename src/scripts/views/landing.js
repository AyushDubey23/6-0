import { auth, db, functions, rtdb } from "../firebaseInit.js";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { signInAnonymously } from "firebase/auth";
import { ref, set, get, serverTimestamp, onValue, remove } from "firebase/database";

function generateClientRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function renderLanding(container) {
  const user = auth.currentUser;
  let statsHTML = "";

  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const stats = userSnap.data().stats;
        if (stats && stats.totalCampaigns > 0) {
          statsHTML = `
            <div class="user-stats-card">
              <h3>Your Career Stats</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-val">${stats.totalCampaigns}</span>
                  <span class="stat-lbl">Campaigns</span>
                </div>
                <div class="stat-item">
                  <span class="stat-val text-gold">${stats.perfectRuns}</span>
                  <span class="stat-lbl">Perfect Runs</span>
                </div>
                <div class="stat-item">
                  <span class="stat-val">${stats.bestNRR > 0 ? "+" : ""}${stats.bestNRR.toFixed(3)}</span>
                  <span class="stat-lbl">Best NRR</span>
                </div>
              </div>
              <a href="#/profile" class="btn btn-secondary mt-2" style="width:100%; text-decoration: none; text-align: center;">View Career History</a>
            </div>
          `;
        }
      }
    } catch (err) {
      console.warn("Could not load user stats for landing:", err);
    }
  }

  container.innerHTML = `
    <!-- Top Quick-Access Pill Navigation Bar -->
    <div class="hero-pill-bar">
      <a href="#/draft" class="hero-nav-pill pill-active" title="Launch solo draft run">
        <span class="pill-dot"></span> SOLO DRAFT
      </a>
      <a href="#/leaderboard" class="hero-nav-pill" title="View global rankings & best NRR">
        🏆 LEADERBOARD <span class="pill-new-tag">NEW</span>
      </a>
      <a href="#/profile" class="hero-nav-pill" title="View career statistics & history">
        👤 PROFILE
      </a>
      <button id="open-rules-btn" class="hero-nav-pill" title="How the 6-0 tournament and draft works">
        ⚙️ HOW TO PLAY ▾
      </button>
    </div>

    <!-- Main Hero Split Grid: 6-0 Retro Typography (Left) + Authentic Cricket Stadium Showcase (Right) -->
    <div class="landing-hero-grid">
      <div class="hero-text-col">
        <div class="hero-kicker">T20 WORLD CUP · 2007 — 2026</div>

        <div class="brand-title-display" aria-label="6-0 Cricket Draft">
          <span class="brand-num">6</span>
          <span class="brand-dash"></span>
          <span class="brand-num">0</span>
        </div>

        <h1 class="hero-main-title">
          Roll the squad.<br>
          Build your dream Playing XI
        </h1>

        <p class="hero-main-desc">
          Roll the squad: you get an authentic national team and a World Cup edition. Pick a star who was actually there, position all 11 into your tactical Playing XI, and simulate — does your team go 6-0 undefeated?
        </p>

        <div class="hero-cta-group">
          <a href="#/draft" class="btn hero-cta-btn-primary" id="hero-roll-btn">
            ⚡ Roll Squad
          </a>
          <button class="btn hero-cta-btn-secondary" id="hero-multiplayer-btn">
            👥 Multiplayer Lobby
          </button>
        </div>
      </div>

      <!-- Hero Right: Authentic Cricket Stadium Canvas with 11 All-Time T20 Legends -->
      <div class="hero-pitch-col">
        <div class="cricket-ground-showcase" id="cricket-ground-showcase" title="Click any cricket legend to inspect ratings!">
          <div class="showcase-pitch-strip"></div>
          
          <!-- Openers -->
          <div class="ground-player-pin" style="top: 15%; left: 32%;" data-name="Chris Gayle" data-detail="West Indies '12 • 97 BAT • 2x T20 World Cup Champion">
            <div class="player-pin-circle">333</div>
            <div class="player-pin-name">Gayle</div>
            <div class="pin-tooltip">C. Gayle • 97 BAT (WI '12)</div>
          </div>
          <div class="ground-player-pin" style="top: 15%; left: 68%;" data-name="Rohit Sharma" data-detail="India '24 • 95 BAT • 2024 World Cup Champion Captain">
            <div class="player-pin-circle">45</div>
            <div class="player-pin-name">Rohit</div>
            <div class="pin-tooltip">R. Sharma • 95 BAT (IND '24)</div>
          </div>

          <!-- Top Order -->
          <div class="ground-player-pin" style="top: 30%; left: 24%;" data-name="Virat Kohli" data-detail="India '14 • 99 BAT • 2x Player of Tournament, 2024 Final MVP">
            <div class="player-pin-circle cap-circle">18</div>
            <div class="player-pin-name">Kohli [C]</div>
            <div class="pin-tooltip">V. Kohli (C) • 99 BAT (IND '14)</div>
          </div>
          <div class="ground-player-pin" style="top: 30%; left: 76%;" data-name="AB de Villiers" data-detail="South Africa '16 • 98 BAT • 360° Matchwinner">
            <div class="player-pin-circle">17</div>
            <div class="player-pin-name">de Villiers</div>
            <div class="pin-tooltip">AB de Villiers • 98 BAT (SA '16)</div>
          </div>

          <!-- Wicketkeeper Behind Stumps -->
          <div class="ground-player-pin" style="top: 36%; left: 50%;" data-name="MS Dhoni" data-detail="India '07 • 96 WK • Inaugural 2007 T20 World Cup Champion Captain">
            <div class="player-pin-circle">7</div>
            <div class="player-pin-name">Dhoni [WK]</div>
            <div class="pin-tooltip">MS Dhoni (WK) • 96 WK (IND '07)</div>
          </div>

          <!-- All-Rounders -->
          <div class="ground-player-pin" style="top: 53%; left: 22%;" data-name="Yuvraj Singh" data-detail="India '07 • 94 ALL • 6 Sixes in an over, 2007 Champion">
            <div class="player-pin-circle">12</div>
            <div class="player-pin-name">Yuvraj</div>
            <div class="pin-tooltip">Y. Singh • 94 ALL (IND '07)</div>
          </div>
          <div class="ground-player-pin" style="top: 53%; left: 78%;" data-name="Shahid Afridi" data-detail="Pakistan '09 • 93 ALL • 2009 Final Player of the Match">
            <div class="player-pin-circle">10</div>
            <div class="player-pin-name">Afridi</div>
            <div class="pin-tooltip">S. Afridi • 93 ALL (PAK '09)</div>
          </div>

          <!-- Spin Wizard -->
          <div class="ground-player-pin" style="top: 68%; left: 50%;" data-name="Rashid Khan" data-detail="Afghanistan '24 • 95 SPIN • All-Time T20 Wicket Hunter">
            <div class="player-pin-circle">19</div>
            <div class="player-pin-name">Rashid</div>
            <div class="pin-tooltip">Rashid Khan • 95 SPIN (AFG '24)</div>
          </div>

          <!-- Pace Battery -->
          <div class="ground-player-pin" style="top: 84%; left: 24%;" data-name="Lasith Malinga" data-detail="Sri Lanka '14 • 96 PACE • 2014 World Cup Winning Captain & Yorker Specialist">
            <div class="player-pin-circle">99</div>
            <div class="player-pin-name">Malinga</div>
            <div class="pin-tooltip">L. Malinga • 96 PACE (SL '14)</div>
          </div>
          <div class="ground-player-pin" style="top: 83%; left: 50%;" data-name="Jasprit Bumrah" data-detail="India '24 • 98 PACE • 2024 Player of Tournament, 4.17 Econ">
            <div class="player-pin-circle">93</div>
            <div class="player-pin-name">Bumrah</div>
            <div class="pin-tooltip">J. Bumrah • 98 PACE (IND '24)</div>
          </div>
          <div class="ground-player-pin" style="top: 84%; left: 76%;" data-name="Mitchell Starc" data-detail="Australia '21 • 94 PACE • Lethal Left-Arm World Cup Strike Bowler">
            <div class="player-pin-circle">56</div>
            <div class="player-pin-name">Starc</div>
            <div class="pin-tooltip">M. Starc • 94 PACE (AUS '21)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Social Proof & 3-Step Feature Strip (Matching Reference 7-0 Screen) -->
    <section class="feature-section-container">
      <div class="squads-count-heading">34,540+ squads drafted across 10 World Cups</div>

      <div class="three-step-card">
        <div class="step-strip-item">
          <span class="step-coral-num">01</span>
          <div class="step-icon-box">🎲</div>
          <div class="step-content-text">
            <span class="step-title">ROLL</span>
            <span class="step-desc">Draws an authentic national team and a T20 World Cup edition (2007–2026)</span>
          </div>
        </div>

        <div class="step-strip-item">
          <span class="step-coral-num">02</span>
          <div class="step-icon-box">🏏</div>
          <div class="step-content-text">
            <span class="step-title">BUILD</span>
            <span class="step-desc">Pick a star who actually played, assign tactical roles & captaincy</span>
          </div>
        </div>

        <div class="step-strip-item">
          <span class="step-coral-num">03</span>
          <div class="step-icon-box">⚡</div>
          <div class="step-content-text">
            <span class="step-title">SIMULATE</span>
            <span class="step-desc">Realistic ball-by-ball match engine — see if your team goes 6-0 undefeated</span>
          </div>
        </div>
      </div>

      <div class="landing-meta-ticker">
        <strong>24</strong> national teams
        <span class="meta-dot">·</span>
        <strong>152</strong> squads
        <span class="meta-dot">·</span>
        <strong>1,680+</strong> players
        <span class="meta-dot">·</span>
        <a id="ticker-rules-link">How does 6-0 simulation work?</a>
      </div>
    </section>

    <!-- Multiplayer Room Creator & Lobby Hub Section -->
    <section id="multiplayer-hub" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2.5px solid #1E1E1E;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <span class="role-badge all-rounder" style="background: #C89B3C; color: #111; font-weight: 900; font-size: 0.72rem; padding: 2px 8px; border: 1px solid #1E1E1E;">MULTIPLAYER ARENA</span>
          <h2 style="font-size: 1.5rem; margin: 0.35rem 0 0 0; font-weight: 950; color: #111111; text-transform: uppercase;">Host or Join a Live Draft Room</h2>
        </div>
        <span style="font-size: 0.8rem; font-weight: 800; color: #666666;">1v1 Head-to-Head Duels &bull; Live Synchronization</span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; align-items: start;">
        <!-- Multiplayer Room Creator Card -->
        <div class="career-stats-widget" style="padding: 1.5rem; background: #FFFFFF; border: 2.5px solid #1E1E1E; box-shadow: 4px 4px 0px #1E1E1E;">
          <h3 style="color: #C89B3C; text-transform: uppercase; font-size: 1.1rem; margin-bottom: 1.25rem; font-weight: 900;">
            Create Room or Join Lobby
          </h3>

          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <!-- Mode (1v1 Duel) -->
            <div>
              <span style="display: block; font-size: 0.85rem; color: #111111; margin-bottom: 0.35rem; font-weight: 800;">Match Mode:</span>
              <div style="background: #FAF6ED; border: 2px solid #1E1E1E; padding: 0.55rem 0.85rem; font-weight: 900; font-size: 0.9rem; color: #111111; display: flex; align-items: center; justify-content: space-between;">
                <span>⚔️ 1v1 Head-to-Head Duel</span>
                <span style="font-size: 0.72rem; color: #E53926; font-weight: 900; background: #FFFFFF; padding: 2px 6px; border: 1px solid #1E1E1E;">2 PLAYERS</span>
              </div>
            </div>

            <!-- Difficulty Selector -->
            <div>
              <span style="display: block; font-size: 0.85rem; color: #111111; margin-bottom: 0.35rem; font-weight: 800;">Draft Difficulty:</span>
              <div class="speed-buttons">
                <button class="speed-btn diff-select-btn active" data-diff="openBook">Open Book (Classic)</button>
                <button class="speed-btn diff-select-btn" data-diff="blindScout">Blind Scout (Memory)</button>
              </div>
            </div>

            <!-- Turn Timer Picker -->
            <div>
              <span style="display: block; font-size: 0.85rem; color: #111111; margin-bottom: 0.35rem; font-weight: 800;">Pick Time Limit:</span>
              <div class="speed-buttons">
                <button class="speed-btn timer-select-btn active" data-timer="20">20 Seconds</button>
                <button class="speed-btn timer-select-btn" data-timer="30">30 Seconds</button>
                <button class="speed-btn timer-select-btn" data-timer="45">45 Seconds</button>
              </div>
            </div>

            <!-- Password -->
            <label>
              <span style="display: block; font-size: 0.85rem; color: #111111; margin-bottom: 0.35rem; font-weight: 800;">Room Password (Optional):</span>
              <input type="password" id="room-password" style="width: 100%; border: 2px solid #1E1E1E; text-align: left; padding: 0.6rem; color: #111111; background: #FFFFFF; font-weight: 800;" placeholder="LEAVE BLANK FOR OPEN ROOM">
            </label>

            <!-- Action buttons -->
            <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
              <button id="show-create-btn" class="btn btn-primary" style="flex: 1;">Create Room</button>
              <button id="show-join-btn" class="btn btn-secondary" style="flex: 1;">Join Room Code</button>
            </div>
          </div>
        </div>

        <!-- Career Stats or Campaign Overview Card -->
        ${statsHTML || `
          <div class="career-stats-widget" style="padding: 1.5rem; background: #FFFFFF; border: 2.5px solid #1E1E1E; box-shadow: 4px 4px 0px #1E1E1E;">
            <h3 style="color: #111111; text-transform: uppercase; font-size: 1.05rem; margin-bottom: 1rem; font-weight: 900;">
              🏆 The Road to 6-0
            </h3>
            <p style="font-size: 0.9rem; line-height: 1.6; color: #444444; margin-bottom: 1.25rem;">
              To achieve the coveted <strong>6-0 Perfect Campaign</strong>, your team must win all 5 Group Stage matches and lift the World Cup Trophy in the Grand Final.
            </p>
            <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.85rem; font-weight: 700; color: #222222;">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span style="background:#FAF6ED; border:1px solid #1E1E1E; padding:2px 6px; font-weight:900;">11</span>
                <span>Tactical Rounds: Openers, Middle-Order, WK, All-Rounders, Pacers & Spinners.</span>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span style="background:#FFF8E1; border:1px solid #C89B3C; padding:2px 6px; font-weight:900;">[C]</span>
                <span>Captaincy: 2x multiplier applied to batting & bowling performances.</span>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span style="background:#FAF6ED; border:1px solid #1E1E1E; padding:2px 6px; font-weight:900;">🎲</span>
                <span>Tactical Rerolls: 2 squad rerolls + 1 same-team edition reroll.</span>
              </div>
            </div>
            <a href="#/draft" class="btn btn-primary mt-3" style="width: 100%; text-align: center; text-decoration: none; display: block;">Launch Solo Draft</a>
          </div>
        `}
      </div>
    </section>

    <!-- Live Public Rooms Waiting For Player 2 Section -->
    <section class="landing-steps mt-4" style="margin-top: 2.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 2.5px solid #1E1E1E; padding-bottom: 0.5rem;">
        <div>
          <span class="role-badge all-rounder" style="background: #E53926; color: #FFFFFF; font-weight: 900; font-size: 0.72rem; padding: 2px 8px; border: 1px solid #1E1E1E;">LIVE LOBBIES</span>
          <h2 style="font-size: 1.5rem; margin: 0.3rem 0 0 0; font-weight: 900; color: #111111;">PUBLIC ROOMS WAITING FOR PLAYERS</h2>
        </div>
        <span style="font-size: 0.78rem; font-weight: 800; color: #666666;">Real-time Updates</span>
      </div>

      <div id="public-rooms-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; min-height: 90px;">
        <div style="padding: 1.5rem; background: #FFFFFF; border: 2px solid #1E1E1E; text-align: center; color: #666666; font-weight: 800; box-shadow: 3px 3px 0px #1E1E1E; grid-column: 1 / -1;">
          Scanning for live waiting rooms...
        </div>
      </div>
    </section>

    <!-- Create Room Name Dialog Overlay -->
    <div id="create-dialog-overlay" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.75); z-index: 999; align-items: center; justify-content: center; padding: 1rem;">
      <div class="career-stats-widget" style="width: 100%; max-width: 420px; padding: 1.75rem; background: #FFFFFF; border: 2.5px solid #1E1E1E; box-shadow: 6px 6px 0px #1E1E1E;">
        <h3 style="color: #C89B3C; text-transform: uppercase; font-size: 1.2rem; margin-bottom: 1.25rem; font-weight: 900;">Create Room — Enter Name</h3>
        
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <label>
            <span style="display: block; font-size: 0.88rem; color: #111111; margin-bottom: 0.35rem; font-weight: 800;">Your Display Name:</span>
            <input type="text" id="create-player-name" style="width: 100%; border: 2px solid #1E1E1E; text-align: left; padding: 0.6rem; color: #111111; background: #FFFFFF; font-size: 0.95rem; font-weight: 800;" placeholder="e.g. Captain Player" value="${user?.displayName || ''}">
          </label>
          
          <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
            <button id="submit-create-btn" class="btn btn-primary" style="flex: 1;">Confirm & Create</button>
            <button id="cancel-create-btn" class="btn btn-secondary" style="flex: 1;">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Join Dialog Overlay -->
    <div id="join-dialog-overlay" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.75); z-index: 999; align-items: center; justify-content: center; padding: 1rem;">
      <div class="career-stats-widget" style="width: 100%; max-width: 420px; padding: 1.75rem; background: #FFFFFF; border: 2.5px solid #1E1E1E; box-shadow: 6px 6px 0px #1E1E1E;">
        <h3 style="color: #C89B3C; text-transform: uppercase; font-size: 1.2rem; margin-bottom: 1.25rem; font-weight: 900;">Join Existing Room</h3>
        
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <label>
            <span style="display: block; font-size: 0.88rem; color: #111111; margin-bottom: 0.35rem; font-weight: 800;">Your Display Name:</span>
            <input type="text" id="join-player-name" style="width: 100%; border: 2px solid #1E1E1E; text-align: left; padding: 0.6rem; color: #111111; background: #FFFFFF; font-size: 0.95rem; font-weight: 800;" placeholder="e.g. Player Two" value="${user?.displayName || ''}">
          </label>
          <label>
            <span style="display: block; font-size: 0.88rem; color: #111111; margin-bottom: 0.35rem; font-weight: 800;">Enter Room Code:</span>
            <input type="text" id="join-room-code" style="width: 100%; border: 2px solid #1E1E1E; text-align: left; padding: 0.6rem; color: #111111; background: #FFFFFF; font-size: 0.95rem; text-transform: uppercase; font-weight: 800;" placeholder="e.g. AB12XY">
          </label>
          <label>
            <span style="display: block; font-size: 0.88rem; color: #111111; margin-bottom: 0.35rem; font-weight: 800;">Enter Password (If required):</span>
            <input type="password" id="join-room-password" style="width: 100%; border: 2px solid #1E1E1E; text-align: left; padding: 0.6rem; color: #111111; background: #FFFFFF; font-size: 0.95rem; font-weight: 800;" placeholder="Leave blank if none">
          </label>
          <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
            <button id="submit-join-btn" class="btn btn-primary" style="flex: 1;">Confirm & Join</button>
            <button id="cancel-join-btn" class="btn btn-secondary" style="flex: 1;">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- How To Play Modal Overlay -->
    <div id="rules-dialog-overlay" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.75); z-index: 999; align-items: center; justify-content: center; padding: 1rem;">
      <div class="career-stats-widget" style="width: 100%; max-width: 540px; padding: 2rem; background: #FFFFFF; border: 2.5px solid #1E1E1E; box-shadow: 6px 6px 0px #1E1E1E; max-height: 90vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 2px solid #1E1E1E; padding-bottom: 0.5rem;">
          <h3 style="color: #111111; text-transform: uppercase; font-size: 1.25rem; font-weight: 950; margin: 0;">
            ⚙️ How to Play 6-0 Cricket Draft
          </h3>
          <button id="close-rules-btn" class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 1rem; font-weight: 900;">&times;</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.9rem; line-height: 1.5; color: #333333;">
          <div>
            <strong style="color: #E53926; font-size: 0.95rem;">01. THE 6-0 OBJECTIVE:</strong>
            <p style="margin: 0.25rem 0 0 0;">Can your drafted squad win 6 matches in a row? Win all 5 tournament group matches and the Grand Final to record a historic 6-0 Perfect Run!</p>
          </div>

          <div>
            <strong style="color: #C89B3C; font-size: 0.95rem;">02. DRAFTING TURNS:</strong>
            <p style="margin: 0.25rem 0 0 0;">Each turn, the machine reveals an authentic international team from a specific T20 World Cup edition (2007–2026). Pick 1 player who was physically in that tournament squad.</p>
          </div>

          <div>
            <strong style="color: #1B6535; font-size: 0.95rem;">03. TEAM BALANCE & ROLES:</strong>
            <p style="margin: 0.25rem 0 0 0;">Position your 11 players into tactical pitch slots: Openers, Top Order, Wicketkeeper, All-Rounders, Pacers, and Spinners. Designate a Captain for 2x performance points.</p>
          </div>

          <div>
            <strong style="color: #0D62A8; font-size: 0.95rem;">04. REALISTIC BALL-BY-BALL SIMULATION:</strong>
            <p style="margin: 0.25rem 0 0 0;">The cricket match physics engine computes realistic strike rates, boundary percentages, bowler economy, wickets, run chases, and tournament Net Run Rate (NRR).</p>
          </div>

          <div>
            <strong style="color: #111111; font-size: 0.95rem;">05. 1V1 MULTIPLAYER DUEL:</strong>
            <p style="margin: 0.25rem 0 0 0;">Draft head-to-head against a friend in a live synchronized room with 20s–45s turn clocks, followed by a simulated match battle between your Playing XIs.</p>
          </div>
        </div>

        <button id="close-rules-btn-bottom" class="btn btn-primary mt-3" style="width: 100%; font-weight: 900;">
          Got It! Let's Play
        </button>
      </div>
    </div>
  `;

  // UI state toggles logic for Room Creator (strictly 1v1 duel)
  const activeMode = "duel";
  let activeDiff = "openBook";
  let activeTimer = 20;

  const diffBtns = container.querySelectorAll(".diff-select-btn");
  diffBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      diffBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeDiff = btn.getAttribute("data-diff");
    });
  });

  const timerBtns = container.querySelectorAll(".timer-select-btn");
  timerBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      timerBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTimer = parseInt(btn.getAttribute("data-timer"), 10);
    });
  });

  // Hero Quick Scroll to Multiplayer Hub
  const heroMultiplayerBtn = container.querySelector("#hero-multiplayer-btn");
  if (heroMultiplayerBtn) {
    heroMultiplayerBtn.addEventListener("click", () => {
      const hub = container.querySelector("#multiplayer-hub");
      if (hub) {
        hub.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Interactive Pins Click Toast / Detail Inspection
  const groundPins = container.querySelectorAll(".ground-player-pin");
  groundPins.forEach(pin => {
    pin.addEventListener("click", () => {
      const name = pin.getAttribute("data-name");
      const detail = pin.getAttribute("data-detail");
      if (window.showToast) {
        window.showToast(`⭐ ${name}: ${detail}`);
      }
    });
  });

  // Rules Modal Triggers
  const rulesOverlay = container.querySelector("#rules-dialog-overlay");
  const openRulesBtn = container.querySelector("#open-rules-btn");
  const tickerRulesLink = container.querySelector("#ticker-rules-link");
  const closeRulesBtn = container.querySelector("#close-rules-btn");
  const closeRulesBtnBottom = container.querySelector("#close-rules-btn-bottom");

  const openRules = () => {
    if (rulesOverlay) rulesOverlay.style.display = "flex";
  };
  const closeRules = () => {
    if (rulesOverlay) rulesOverlay.style.display = "none";
  };

  if (openRulesBtn) openRulesBtn.addEventListener("click", openRules);
  if (tickerRulesLink) tickerRulesLink.addEventListener("click", openRules);
  if (closeRulesBtn) closeRulesBtn.addEventListener("click", closeRules);
  if (closeRulesBtnBottom) closeRulesBtnBottom.addEventListener("click", closeRules);
  if (rulesOverlay) {
    rulesOverlay.addEventListener("click", (e) => {
      if (e.target === rulesOverlay) closeRules();
    });
  }

  // Create Room Dialog Triggers
  const createOverlay = container.querySelector("#create-dialog-overlay");
  const showCreateBtn = container.querySelector("#show-create-btn");
  const cancelCreateBtn = container.querySelector("#cancel-create-btn");
  const submitCreateBtn = container.querySelector("#submit-create-btn");

  if (showCreateBtn && createOverlay) {
    showCreateBtn.addEventListener("click", () => {
      createOverlay.style.display = "flex";
      const nameInput = container.querySelector("#create-player-name");
      if (nameInput) nameInput.focus();
    });
  }

  if (cancelCreateBtn && createOverlay) {
    cancelCreateBtn.addEventListener("click", () => {
      createOverlay.style.display = "none";
    });
  }

  if (submitCreateBtn) {
    submitCreateBtn.addEventListener("click", async () => {
      const nameInput = container.querySelector("#create-player-name").value.trim();
      const pwInput = container.querySelector("#room-password").value.trim();
      
      const displayName = nameInput || "Host Player";
      
      try {
        submitCreateBtn.disabled = true;
        if (!auth.currentUser) {
          try { await signInAnonymously(auth); } catch (authErr) { console.warn("Anonymous login skipped:", authErr); }
        }
        const userUid = auth.currentUser ? auth.currentUser.uid : ("user_" + Math.random().toString(36).substring(2, 9));

        let roomCode = null;
        try {
          const createRoomFn = httpsCallable(functions, "createRoom");
          const res = await createRoomFn({
            mode: activeMode,
            difficulty: activeDiff,
            turnTimerSeconds: activeTimer,
            password: pwInput || null,
            displayName
          });
          roomCode = res.data.code;
        } catch (fnErr) {
          console.warn("Cloud function createRoom failed, performing RTDB direct room creation fallback:", fnErr);
          roomCode = generateClientRoomCode();
          const roomRef = ref(rtdb, `rooms/${roomCode}`);
          const initialRoomState = {
            hostUid: userUid,
            mode: activeMode,
            difficulty: activeDiff,
            turnTimerSeconds: activeTimer,
            password: pwInput || null,
            status: "lobby",
            createdAt: serverTimestamp(),
            players: {
              [userUid]: {
                displayName: displayName,
                joinedAt: serverTimestamp(),
                ready: true,
                connectionStatus: "online"
              }
            },
            draftState: {
              turnIndex: 0,
              activePlayerUid: "",
              currentReveal: null,
              turnDeadline: null,
              claimedPlayerIds: []
            },
            squads: {}
          };
          await set(roomRef, initialRoomState);
        }

        if (auth.currentUser && nameInput) {
          auth.currentUser.displayName = displayName;
        }

        createOverlay.style.display = "none";
        if (window.showToast) window.showToast("Room successfully created!");
        window.location.hash = `#/room/${roomCode}`;
      } catch (err) {
        submitCreateBtn.disabled = false;
        if (window.showToast) window.showToast(err.message, true);
      }
    });
  }

  // Join Room Dialog Triggers
  const joinOverlay = container.querySelector("#join-dialog-overlay");
  const showJoinBtn = container.querySelector("#show-join-btn");
  const cancelJoinBtn = container.querySelector("#cancel-join-btn");
  const submitJoinBtn = container.querySelector("#submit-join-btn");

  if (showJoinBtn && joinOverlay) {
    showJoinBtn.addEventListener("click", () => {
      joinOverlay.style.display = "flex";
      const nameInput = container.querySelector("#join-player-name");
      if (nameInput) nameInput.focus();
    });
  }

  if (cancelJoinBtn && joinOverlay) {
    cancelJoinBtn.addEventListener("click", () => {
      joinOverlay.style.display = "none";
    });
  }

  if (submitJoinBtn) {
    submitJoinBtn.addEventListener("click", async () => {
      const nameInput = container.querySelector("#join-player-name").value.trim();
      const codeInput = container.querySelector("#join-room-code").value.trim().toUpperCase();
      const pwInput = container.querySelector("#join-room-password").value.trim();
      
      if (!codeInput) {
        if (window.showToast) window.showToast("Please enter a room code!", true);
        return;
      }

      const displayName = nameInput || "Guest Player";

      try {
        submitJoinBtn.disabled = true;
        if (!auth.currentUser) {
          try { await signInAnonymously(auth); } catch (authErr) { console.warn("Anonymous login skipped:", authErr); }
        }
        const userUid = auth.currentUser ? auth.currentUser.uid : ("user_" + Math.random().toString(36).substring(2, 9));

        try {
          const joinRoomFn = httpsCallable(functions, "joinRoom");
          await joinRoomFn({
            code: codeInput,
            password: pwInput || null,
            displayName
          });
        } catch (fnErr) {
          console.warn("Cloud function joinRoom failed, performing RTDB direct join fallback:", fnErr);
          const roomSnap = await get(ref(rtdb, `rooms/${codeInput}`));
          if (!roomSnap.exists()) {
            throw new Error("Room not found.");
          }
          const roomData = roomSnap.val();
          if (roomData.status !== "lobby") {
            throw new Error("Draft has already started in this room.");
          }
          if (roomData.password && roomData.password !== pwInput) {
            throw new Error("Incorrect room password.");
          }
          const playerRef = ref(rtdb, `rooms/${codeInput}/players/${userUid}`);
          await set(playerRef, {
            displayName: displayName,
            joinedAt: serverTimestamp(),
            ready: false,
            connectionStatus: "online"
          });
        }

        if (auth.currentUser && nameInput) {
          auth.currentUser.displayName = displayName;
        }

        joinOverlay.style.display = "none";
        if (window.showToast) window.showToast("Joined room successfully!");
        window.location.hash = `#/room/${codeInput}`;
      } catch (err) {
        submitJoinBtn.disabled = false;
        if (window.showToast) window.showToast(err.message, true);
      }
    });
  }

  // Real-time listener for public rooms waiting for Player 2
  const roomsRef = ref(rtdb, 'rooms');
  onValue(roomsRef, (snap) => {
    const publicContainer = container.querySelector("#public-rooms-container");
    if (!publicContainer) return;

    const allRooms = snap.val() || {};
    const openRooms = [];

    Object.keys(allRooms).forEach(code => {
      const r = allRooms[code];
      if (r && r.status === "lobby") {
        const players = r.players || {};
        const pKeys = Object.keys(players);
        const createdAt = r.createdAt || Date.now();
        const elapsed = Date.now() - createdAt;
        const TWO_MINS_MS = 120000;
        const FIVE_MINS_MS = 300000;

        // Auto-delete 1-player rooms older than 2 minutes
        if (pKeys.length === 1 && elapsed >= TWO_MINS_MS) {
          try { remove(ref(rtdb, `rooms/${code}`)); } catch (e) {}
          return;
        }

        // Public open rooms (waiting for player 2 and no password)
        const maxP = 2;
        if (pKeys.length < maxP && !r.password) {
          const hostPlayer = players[pKeys[0]] || {};
          openRooms.push({
            code,
            hostName: hostPlayer.displayName || "Host Player",
            mode: "1v1 DUEL",
            timerSec: r.turnTimerSeconds || 20,
            playerCount: pKeys.length,
            maxP: 2,
            createdAt: r.createdAt || Date.now()
          });
        }
      }
    });

    if (openRooms.length === 0) {
      publicContainer.innerHTML = `
        <div style="padding: 1.5rem; background: #FFFFFF; border: 2px solid #1E1E1E; text-align: center; color: #666666; font-weight: 800; box-shadow: 3px 3px 0px #1E1E1E; grid-column: 1 / -1;">
          No open public rooms waiting right now. Click <strong>Create Room</strong> above to host one!
        </div>
      `;
      return;
    }

    publicContainer.innerHTML = openRooms.map(r => `
      <div style="background: #FFFFFF; border: 2.5px solid #1E1E1E; padding: 1.1rem; box-shadow: 4px 4px 0px #1E1E1E; border-radius: 0px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span class="role-badge all-rounder" style="background: #C89B3C; color: #111; font-weight: 900; font-size: 0.68rem; padding: 2px 6px;">${r.mode.toUpperCase()}</span>
            <span style="font-family: var(--font-family-mono); font-weight: 900; font-size: 0.9rem; color: #E53926;">#${r.code}</span>
          </div>
          <div style="font-weight: 900; font-size: 1.1rem; color: #111111; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${r.hostName}'s Room
          </div>
          <div style="font-size: 0.78rem; font-weight: 700; color: #555555; margin-bottom: 1rem;">
            ${r.playerCount}/${r.maxP} Players • ${r.playerCount < r.maxP ? 'Waiting for players' : 'Full'}
          </div>
        </div>
        <button class="btn btn-primary btn-sm join-public-room-btn" data-code="${r.code}" style="width: 100%; font-weight: 900; background: #E53926; border: 1.5px solid #1E1E1E;">
          ⚡ Join Match
        </button>
      </div>
    `).join("");

    const joinBtns = publicContainer.querySelectorAll(".join-public-room-btn");
    joinBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-code");
        window.location.hash = `#/room/${code}`;
      });
    });
  });
}
