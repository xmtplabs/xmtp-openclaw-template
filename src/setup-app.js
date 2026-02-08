// Served at /setup/app.js
// No fancy syntax: keep it maximally compatible.

(function () {
  // Header status elements
  var statusDot = document.getElementById('status-dot');
  var statusText = document.getElementById('status-text');

  // Auth config elements
  var authGroupEl = document.getElementById('authGroup');

  // Setup log elements
  var logEl = document.getElementById('log');
  var setupErrorEl = document.getElementById('setup-error');

  // Debug console
  var consoleCmdEl = document.getElementById('consoleCmd');
  var consoleArgEl = document.getElementById('consoleArg');
  var consoleRunEl = document.getElementById('consoleRun');
  var consoleOutEl = document.getElementById('consoleOut');

  // Config editor
  var configPathEl = document.getElementById('configPath');
  var configTextEl = document.getElementById('configText');
  var configReloadEl = document.getElementById('configReload');
  var configSaveEl = document.getElementById('configSave');
  var configOutEl = document.getElementById('configOut');

  // Import
  var importFileEl = document.getElementById('importFile');
  var importRunEl = document.getElementById('importRun');
  var importOutEl = document.getElementById('importOut');

  // Buttons
  var startSetupBtn = document.getElementById('startSetup');

  // API key input
  var authSecretEl = document.getElementById('authSecret');
  var authSecretHintEl = document.getElementById('authSecretHint');

  // XMTP address display
  var xmtpAddressBlock = document.getElementById('xmtp-address-block');
  var xmtpAddressValue = document.getElementById('xmtp-address-value');
  var xmtpAddressCopyBtn = document.getElementById('xmtp-address-copy');
  var xmtpChatDmLink = document.getElementById('xmtp-chat-dm-link');
  var setupFieldsEl = document.getElementById('setup-fields');

  // Settings links (deeplinked with gateway token)
  var settingsLinkHeader = document.getElementById('settings-link-header');
  var settingsLinkAdvanced = document.getElementById('settings-link-advanced');

  // Auth groups from status (includes envVarSet per provider)
  var authGroupsData = [];

  // State tracking
  var statusCheckInProgress = true;

  function setStatus(text, state) {
    if (statusText) statusText.textContent = text;
    if (statusDot) {
      statusDot.className = 'status-dot';
      if (state === 'success') {
        statusDot.style.background = '#34C759';
      } else if (state === 'pending') {
        statusDot.classList.add('pending');
      } else if (state === 'error') {
        statusDot.classList.add('error');
      }
    }
    var settingsLink = document.getElementById('settings-link-header');
    if (settingsLink) {
      if (state === 'error') {
        settingsLink.textContent = 'Refresh';
        settingsLink.href = '#';
        settingsLink.removeAttribute('target');
        settingsLink.title = 'Refresh page';
        settingsLink.onclick = function (e) { e.preventDefault(); location.reload(); };
      } else {
        settingsLink.textContent = 'Settings \u{1F980}';
        settingsLink.href = '/openclaw';
        settingsLink.setAttribute('target', '_blank');
        settingsLink.title = 'Open OpenClaw UI';
        settingsLink.onclick = null;
      }
    }
  }

  function showError(message) {
    if (setupErrorEl) {
      setupErrorEl.textContent = message;
      setupErrorEl.style.display = 'block';
    }
  }

  function hideError() {
    if (setupErrorEl) {
      setupErrorEl.style.display = 'none';
    }
  }

  function showLog(content) {
    if (logEl) {
      logEl.textContent = content;
      logEl.style.display = 'block';
    }
  }

  function appendLog(content) {
    if (logEl) {
      logEl.textContent += content;
      logEl.style.display = 'block';
    }
  }

  function renderAuth(groups) {
    if (!authGroupEl) return;
    authGroupEl.innerHTML = '';
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      var opt = document.createElement('option');
      opt.value = g.value;
      opt.textContent = g.label + (g.hint ? ' - ' + g.hint : '');
      authGroupEl.appendChild(opt);
    }
  }

  function httpJson(url, opts) {
    opts = opts || {};
    opts.credentials = 'same-origin';
    return fetch(url, opts).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) {
          throw new Error('HTTP ' + res.status + ': ' + (t || res.statusText));
        });
      }
      return res.json();
    });
  }

  function setStartSetupLoading(loading) {
    if (!startSetupBtn) return;
    if (loading) {
      startSetupBtn.disabled = true;
      startSetupBtn.classList.add('loading');
      var btnTpl = document.getElementById('snippet-btn-loading');
      startSetupBtn.innerHTML = btnTpl ? btnTpl.innerHTML : 'Loading...';
    } else {
      startSetupBtn.classList.remove('loading');
      startSetupBtn.textContent = 'Start Setup';
      updateStartSetupEnabled();
    }
  }

  function updateStartSetupEnabled() {
    if (!startSetupBtn || statusCheckInProgress) return;
    var idx = authGroupEl ? parseInt(authGroupEl.value, 10) : -1;
    var fromEnv = !isNaN(idx) && authGroupsData[idx] && authGroupsData[idx].envVarSet;
    var hasApiKey = fromEnv || (authSecretEl && authSecretEl.value.trim().length > 0);
    startSetupBtn.disabled = !hasApiKey;
  }

  function setXmtpAddress(addr, xmtpEnv) {
    if (!addr) {
      if (xmtpAddressBlock) xmtpAddressBlock.style.display = 'none';
      if (setupFieldsEl) setupFieldsEl.style.display = '';
      return;
    }
    if (xmtpAddressValue) xmtpAddressValue.textContent = addr;
    if (xmtpChatDmLink) {
      xmtpChatDmLink.href = 'http://xmtp.chat/' + (xmtpEnv || 'production') + '/dm/' + addr;
    }
    if (xmtpAddressBlock) xmtpAddressBlock.style.display = '';
    if (setupFieldsEl) setupFieldsEl.style.display = 'none';
  }

  function copyXmtpAddress() {
    if (!xmtpAddressValue || !xmtpAddressValue.textContent) return;
    navigator.clipboard.writeText(xmtpAddressValue.textContent).then(function () {
      if (xmtpAddressCopyBtn) {
        var t = xmtpAddressCopyBtn.textContent;
        xmtpAddressCopyBtn.textContent = 'Copied!';
        setTimeout(function () { xmtpAddressCopyBtn.textContent = t; }, 1500);
      }
    });
  }

  function applyAuthSecretFromEnv() {
    if (!authSecretEl || !authSecretHintEl) return;
    var idx = authGroupEl ? parseInt(authGroupEl.value, 10) : -1;
    var fromEnv = !isNaN(idx) && authGroupsData[idx] && authGroupsData[idx].envVarSet;
    if (fromEnv) {
      authSecretEl.disabled = true;
      authSecretEl.classList.add('from-env');
      authSecretEl.placeholder = '';
      authSecretEl.value = '';
      authSecretHintEl.classList.remove('hidden');
    } else {
      authSecretEl.disabled = false;
      authSecretEl.classList.remove('from-env');
      authSecretEl.placeholder = 'Paste API key';
      authSecretHintEl.classList.add('hidden');
    }
    updateStartSetupEnabled();
  }

  var setupHeaderEl = document.getElementById('setup-header');

  function refreshStatus() {
    setStatus('Loading...', 'pending');
    setStartSetupLoading(true);
    return httpJson('/setup/api/status').then(function (j) {
      statusCheckInProgress = false;
      authGroupsData = j.authGroups || [];
      var ver = j.openclawVersion ? j.openclawVersion : '';
      if (setupHeaderEl) setupHeaderEl.classList.toggle('setup-required', !j.configured);
      if (j.configured) {
        setStatus('Ready' + (ver ? ' - ' + ver : ''), 'success');
        if (startSetupBtn) startSetupBtn.style.display = 'none';
      } else {
        setStatus('Setup required' + (ver ? ' - ' + ver : ''), 'pending');
        if (startSetupBtn) startSetupBtn.style.display = '';
      }
      renderAuth(authGroupsData);
      applyAuthSecretFromEnv();

      var addr = j.publicAddress || (j.xmtp && j.xmtp.publicAddress);
      setXmtpAddress(addr, j.xmtpEnv);

      // Deeplink settings links with gateway token
      if (j.gatewayToken) {
        var tokenUrl = '/openclaw?token=' + encodeURIComponent(j.gatewayToken);
        if (settingsLinkHeader) settingsLinkHeader.href = tokenUrl;
        if (settingsLinkAdvanced) settingsLinkAdvanced.href = tokenUrl;
      }

      setStartSetupLoading(false);

      // Load config editor content
      if (configReloadEl && configTextEl) {
        loadConfigRaw();
      }
    }).catch(function (e) {
      statusCheckInProgress = false;
      setStatus('Error', 'error');
      setStartSetupLoading(false);
    });
  }

  // Debug console runner
  function runConsole() {
    if (!consoleCmdEl || !consoleRunEl) return;
    var cmd = consoleCmdEl.value;
    var arg = consoleArgEl ? consoleArgEl.value : '';
    if (consoleOutEl) {
      consoleOutEl.textContent = 'Running ' + cmd + '...\n';
      consoleOutEl.style.display = 'block';
    }

    return httpJson('/setup/api/console/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cmd: cmd, arg: arg })
    }).then(function (j) {
      if (consoleOutEl) consoleOutEl.textContent = (j.output || JSON.stringify(j, null, 2));
      return refreshStatus();
    }).catch(function (e) {
      if (consoleOutEl) consoleOutEl.textContent += '\nError: ' + String(e) + '\n';
    });
  }

  if (consoleRunEl) {
    consoleRunEl.onclick = runConsole;
  }

  // Config raw load/save
  function loadConfigRaw() {
    if (!configTextEl) return;
    if (configOutEl) configOutEl.style.display = 'none';
    return httpJson('/setup/api/config/raw').then(function (j) {
      if (configPathEl) {
        configPathEl.textContent = (j.path || '(unknown)') + (j.exists ? '' : ' (new)');
      }
      configTextEl.value = j.content || '';
    }).catch(function (e) {
      if (configOutEl) {
        configOutEl.textContent = 'Error loading config: ' + String(e);
        configOutEl.style.display = 'block';
      }
    });
  }

  function saveConfigRaw() {
    if (!configTextEl) return;
    if (!confirm('Save config and restart gateway?')) return;
    if (configOutEl) {
      configOutEl.textContent = 'Saving...\n';
      configOutEl.style.display = 'block';
    }
    return httpJson('/setup/api/config/raw', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: configTextEl.value })
    }).then(function (j) {
      if (configOutEl) configOutEl.textContent = 'Saved. Gateway restarted.\n';
      return refreshStatus();
    }).catch(function (e) {
      if (configOutEl) configOutEl.textContent += '\nError: ' + String(e) + '\n';
    });
  }

  if (configReloadEl) configReloadEl.onclick = loadConfigRaw;
  if (configSaveEl) configSaveEl.onclick = saveConfigRaw;

  // Import backup
  function runImport() {
    if (!importRunEl || !importFileEl) return;
    var f = importFileEl.files && importFileEl.files[0];
    if (!f) {
      alert('Pick a .tar.gz file first');
      return;
    }
    if (!confirm('Import backup? This overwrites files and restarts the gateway.')) return;

    if (importOutEl) {
      importOutEl.textContent = 'Uploading ' + f.name + '...\n';
      importOutEl.style.display = 'block';
    }

    return f.arrayBuffer().then(function (buf) {
      return fetch('/setup/import', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/gzip' },
        body: buf
      });
    }).then(function (res) {
      return res.text().then(function (t) {
        if (importOutEl) importOutEl.textContent += t + '\n';
        if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + t);
        return refreshStatus();
      });
    }).catch(function (e) {
      if (importOutEl) importOutEl.textContent += '\nError: ' + String(e) + '\n';
    });
  }

  if (importRunEl) importRunEl.onclick = runImport;

  // Reset button
  var resetBtn = document.getElementById('reset');
  if (resetBtn) {
    resetBtn.onclick = function () {
      if (!confirm('Reset setup? This deletes the config file.')) return;
      showLog('Resetting...\n');
      fetch('/setup/api/reset', { method: 'POST', credentials: 'same-origin' })
        .then(function (res) { return res.text(); })
        .then(function (t) {
          appendLog(t + '\n');
          if (startSetupBtn) {
            startSetupBtn.style.display = '';
            startSetupBtn.disabled = false;
            startSetupBtn.textContent = 'Start Setup';
          }
          return refreshStatus();
        })
        .catch(function (e) { appendLog('Error: ' + String(e) + '\n'); });
    };
  }

  // Start Setup - writes config, starts gateway (XMTP-only)
  function runStartSetup() {
    if (!startSetupBtn) return;

    hideError();

    var payload = {
      authGroup: authGroupEl ? authGroupEl.value : '',
      authSecret: document.getElementById('authSecret') ? document.getElementById('authSecret').value : ''
    };

    startSetupBtn.disabled = true;
    startSetupBtn.classList.add('loading');
    var btnTpl = document.getElementById('snippet-btn-loading');
    startSetupBtn.innerHTML = btnTpl ? btnTpl.innerHTML : 'Loading...';
    setStatus('Loading...', 'pending');
    showLog('Starting setup...\n');

    httpJson('/setup/api/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (data) {
      if (!data.success) {
        throw new Error(data.error || 'Setup failed');
      }
      appendLog('Setup complete.\n');
      if (data.publicAddress) {
        setXmtpAddress(data.publicAddress);
        appendLog('XMTP address: ' + data.publicAddress + '\n');
      }
      setStatus('Ready', 'success');
      startSetupBtn.classList.remove('loading');
      startSetupBtn.textContent = 'Start Setup';
      updateStartSetupEnabled();
      refreshStatus();
    }).catch(function (err) {
      showError(err.message);
      startSetupBtn.classList.remove('loading');
      startSetupBtn.textContent = 'Start Setup';
      updateStartSetupEnabled();
      refreshStatus();
    });
  }

  if (startSetupBtn) startSetupBtn.onclick = runStartSetup;

  if (xmtpAddressCopyBtn) xmtpAddressCopyBtn.onclick = copyXmtpAddress;
  if (xmtpAddressValue) xmtpAddressValue.onclick = copyXmtpAddress;

  if (authSecretEl) {
    authSecretEl.addEventListener('input', updateStartSetupEnabled);
    authSecretEl.addEventListener('change', updateStartSetupEnabled);
  }
  if (authGroupEl) {
    authGroupEl.addEventListener('change', applyAuthSecretFromEnv);
  }

  // Initial load
  setStartSetupLoading(true);
  refreshStatus();
})();
