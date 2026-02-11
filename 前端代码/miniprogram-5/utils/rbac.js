function normalizeRole(role) {
  const raw = String(role || '').trim().toUpperCase()
  if (!raw) return ''
  if (raw === 'MERCHANT') return 'MANUFACTURER'
  if (raw === 'QC' || raw === 'INSPECTOR' || raw === 'QUALITY_INSPECTOR' || raw === 'QUALITYCONTROL') return 'QUALITY'
  return raw
}

const FEATURE_MATRIX = {
  ADMIN: ['BATCH', 'PLANTING', 'PROCESSING', 'LOGISTICS', 'INSPECTION', 'SECURITY', 'TERMINAL_QRCODE', 'DASHBOARD', 'LOGS', 'USER_MGMT', 'QRCODE'],
  FARMER: ['BATCH', 'PLANTING'],
  MANUFACTURER: ['BATCH', 'PROCESSING', 'LOGISTICS', 'QRCODE'],
  FACTORY: ['BATCH', 'PROCESSING', 'LOGISTICS', 'QRCODE'],
  LOGISTICS: ['LOGISTICS'],
  QUALITY: ['INSPECTION', 'QRCODE'],
  REGULATOR: ['BATCH', 'PROCESSING', 'LOGISTICS', 'INSPECTION', 'SECURITY', 'TERMINAL_QRCODE', 'LOGS', 'QRCODE'],
  USER: ['BATCH']
}

function hasFeatureAccess(role, feature) {
  const normalizedRole = normalizeRole(role)
  if (!normalizedRole || !feature) return false
  const features = FEATURE_MATRIX[normalizedRole] || []
  return features.includes(feature)
}

function getMenuAccess(role) {
  return {
    batch: hasFeatureAccess(role, 'BATCH'),
    planting: hasFeatureAccess(role, 'PLANTING'),
    processing: hasFeatureAccess(role, 'PROCESSING'),
    logistics: hasFeatureAccess(role, 'LOGISTICS'),
    inspection: hasFeatureAccess(role, 'INSPECTION'),
    security: hasFeatureAccess(role, 'SECURITY'),
    terminalQrcode: hasFeatureAccess(role, 'TERMINAL_QRCODE'),
    dashboard: hasFeatureAccess(role, 'DASHBOARD'),
    logs: hasFeatureAccess(role, 'LOGS'),
    userMgmt: hasFeatureAccess(role, 'USER_MGMT')
  }
}

function guardFeatureAccess(role, feature, redirectUrl) {
  if (hasFeatureAccess(role, feature)) return true
  wx.showToast({ title: '无权限', icon: 'none' })
  setTimeout(() => {
    wx.reLaunch({ url: redirectUrl || '/pages/index/index' })
  }, 80)
  return false
}

module.exports = {
  normalizeRole,
  hasFeatureAccess,
  getMenuAccess,
  guardFeatureAccess
}
