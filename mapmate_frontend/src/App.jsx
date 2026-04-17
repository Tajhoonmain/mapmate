import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EnvironmentSelection from './pages/EnvironmentSelection';
import DestinationInput from './pages/DestinationInput';
import ARNavigation from './pages/ARNavigation';
import Landing from './pages/Landing';

function App() {
  return (
    <Router>
      <div className="dark h-full w-full">
        <Routes>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/environment" element={<EnvironmentSelection />} />
            <Route path="/destination" element={<DestinationInput />} />
            <Route path="/ar" element={<ARNavigation />} />
            <Route path="/" element={<Landing />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
