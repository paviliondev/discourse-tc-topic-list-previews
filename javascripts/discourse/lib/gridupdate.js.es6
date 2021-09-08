import loadScript from 'discourse/lib/load-script';

window.addEventListener ('resize', resizeAllGridItems);
window.addEventListener ('scroll', resizeAllGridItems);

function resizeGridItem (item, grid, rowHeight, rowGap) {
  loadScript (
    'https://unpkg.com/imagesloaded@4/imagesloaded.pkgd.min.js'
  ).then (() => {
    imagesLoaded (item, function () {
      const contentHeight = item.childNodes[1].getBoundingClientRect ().height;
      const rowSpan = Math.ceil (
        (contentHeight + rowGap) / (rowHeight + rowGap)
      );
      item.style.gridRowEnd = 'span ' + rowSpan;
    });
  });
}

function resizeAllGridItems () {
  const allItems = document.getElementsByClassName ('tiles-grid-item');
  let grid = false;

  grid = document.getElementsByTagName('tbody')[0];

  if (!grid) {
    return;
  }
  const rowHeight = parseInt (
    window.getComputedStyle (grid).getPropertyValue ('grid-auto-rows')
  );
  const rowGap = parseInt (
    window.getComputedStyle (grid).getPropertyValue ('grid-row-gap')
  );
  for (var x = 0; x < allItems.length; x++) {
    resizeGridItem (allItems[x], grid, rowHeight, rowGap);
  }
}

export {resizeAllGridItems};
