function readPackage(pkg, context) {
  // اسمح للمكتبات دي بتشغيل الـ scripts بتاعها
  if (pkg.name === 'esbuild' || pkg.name === 'sharp') {
    context.log('Allowing build scripts for ' + pkg.name);
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
};
