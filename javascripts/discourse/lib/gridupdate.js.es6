import loadScript from 'discourse/lib/load-script';

window.addEventListener ('scroll', resizeAllGridItems);

function resizeGridItem (item, grid, rowHeight, rowGap) {
  loadScript (
    settings.theme_uploads.imagesloaded
  ).then (() => {
    imagesLoaded (item, function () {
      console.log('resizeGridItem')
      const contentHeight = item.firstElementChild.getBoundingClientRect().height;
      let rowSpan = Math.ceil (
        (contentHeight + rowGap) / (rowHeight + rowGap)
      );
      if (rowSpan !== rowSpan) {
        rowSpan = 1;
      }
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
