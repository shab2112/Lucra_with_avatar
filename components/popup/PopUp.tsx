/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { FC } from 'react';
import './PopUp.css';

interface PopUpProps {
  onClose: () => void;
}

const PopUp: React.FC<PopUpProps> = ({ onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Welcome to the Interactive Dubai Real Estate Explorer</h2>
        <div className="popup-scrollable-content">
          <p>
            This interactive demo showcases how Gemini can be integrated with your own data and Google Maps to create a powerful, voice-driven real estate exploration tool.
          </p>
          <p>Plan a property search using natural language:</p>
          <ol>
            <li>
              <span className="icon">play_circle</span>
              <div>Press the <strong>&nbsp; Play &nbsp;</strong> button to start the conversation.</div>
            </li>
            <li>
              <span className="icon">record_voice_over</span>
              <div><strong>Speak naturally &nbsp;</strong>to find properties. Try saying, "Show me Dubai Hills Estate."</div>
            </li>
            <li>
              <span className="icon">apartment</span>
              <div>Ask to find specific property types, like <strong>"Show me villas in that area."</strong></div>
            </li>
            <li>
              <span className="icon">map</span>
              <div>Watch as the map <strong>&nbsp; dynamically updates &nbsp;</strong> with communities and project locations.</div>
            </li>
            <li>
              <span className="icon">school</span>
              <div>Ask for nearby amenities, like <strong>"Where are the closest schools?"</strong></div>
            </li>
          </ol>
        </div>
        <button onClick={onClose}>Let's Get Started!</button>
      </div>
    </div>
  );
};

export default PopUp;