import { useState } from 'react';
import toast from 'react-hot-toast';
import './AccountPages.css';

const DEFAULTS = {
  emailUpdates: true,
  analysisTips: true,
  compactDashboard: false,
  defaultRole: 'Software Engineer',
};

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('resumely-settings') || '{}') };
    } catch {
      return DEFAULTS;
    }
  });

  const updateSetting = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    localStorage.setItem('resumely-settings', JSON.stringify(next));
  };

  const save = () => {
    localStorage.setItem('resumely-settings', JSON.stringify(settings));
    toast.success('Settings saved');
  };

  return (
    <div className="account-page animate-fade">
      <div className="account-page-header">
        <div>
          <p className="account-kicker">Settings</p>
          <h1>Workspace preferences</h1>
          <p>Control defaults and reminders for your resume workspace.</p>
        </div>
        <button className="btn btn-primary" onClick={save}>Save Settings</button>
      </div>

      <div className="settings-grid">
        <section className="account-card">
          <p className="account-card-label">Analysis defaults</p>
          <label className="settings-field">
            <span>Default target role</span>
            <select
              className="form-input"
              value={settings.defaultRole}
              onChange={(event) => updateSetting('defaultRole', event.target.value)}
            >
              <option>Software Engineer</option>
              <option>Frontend Developer</option>
              <option>Data Analyst</option>
              <option>Product Manager</option>
              <option>Business Analyst</option>
              <option>UX Designer</option>
            </select>
          </label>
        </section>

        <section className="account-card">
          <p className="account-card-label">Notifications</p>
          <label className="settings-toggle">
            <span>
              <strong>Email updates</strong>
              <small>Receive account and resume activity updates.</small>
            </span>
            <input
              type="checkbox"
              checked={settings.emailUpdates}
              onChange={(event) => updateSetting('emailUpdates', event.target.checked)}
            />
          </label>
          <label className="settings-toggle">
            <span>
              <strong>Analysis tips</strong>
              <small>Show improvement nudges after each analysis.</small>
            </span>
            <input
              type="checkbox"
              checked={settings.analysisTips}
              onChange={(event) => updateSetting('analysisTips', event.target.checked)}
            />
          </label>
        </section>

        <section className="account-card">
          <p className="account-card-label">Display</p>
          <label className="settings-toggle">
            <span>
              <strong>Compact dashboard</strong>
              <small>Reduce spacing in dashboard lists and summary panels.</small>
            </span>
            <input
              type="checkbox"
              checked={settings.compactDashboard}
              onChange={(event) => updateSetting('compactDashboard', event.target.checked)}
            />
          </label>
        </section>
      </div>
    </div>
  );
}
