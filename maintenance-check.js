// Amazon Storefront Global Maintenance Guard
(function() {
  const MAINTENANCE_ACTIVE = true;
  if (!MAINTENANCE_ACTIVE) return;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    // Allow admin bypass if requested: ?bypass=admin, ?admin=1, or active admin session
    if (urlParams.get('bypass') === 'admin' || 
        urlParams.get('admin') === '1' || 
        sessionStorage.getItem('amazon_admin_authenticated') === 'true') {
      return;
    }

    const currentPath = window.location.pathname || '';
    const isRoot = currentPath === '/' || currentPath === '/index.html' || currentPath === '/maintenance.html' || currentPath.endsWith('/index.html') && !currentPath.includes('/store/') && !currentPath.includes('/orders/');
    if (!isRoot) {
      window.location.replace('/' + (window.location.search || ''));
    }
  } catch (e) {}
})();
