import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import PublisherChatBot from './PublisherChatBot';
import AdvertiserChatBot from './AdvertiserChatBot';
import PredictChatBot from './PredictChatBot';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/publisher" element={<PublisherChatBot />} />
        <Route path="/advertiser" element={<AdvertiserChatBot />} />
        <Route path="/predict" element={<PredictChatBot />} />
      </Routes>
    </Router>
  );
}

export default App;
