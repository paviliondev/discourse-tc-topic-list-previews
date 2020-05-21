import loadScript from 'discourse/lib/load-script';

var resizeAllGridItems = base => {
  if (!base) {
    return;
  }
  loadScript (
    'https://unpkg.com/masonry-layout@4.2.2/dist/masonry.pkgd.min.js'
  ).then (() => {
    loadScript (
      'https://unpkg.com/imagesloaded@4/imagesloaded.pkgd.min.js'
    ).then (() => {
      //  debugger;
      var columns = 3;
      var setColumns = function () {
        columns = $ (window).width () > 700
          ? 3
          : $ (window).width () > 480 ? 2 : 1;
      };

      setColumns ();
      // debugger;
      // initialize
      let msnry = $ ('.tiles-grid').data ('masonry');
      //debugger;
      if (msnry) {
        //debugger;
        msnry.reloadItems ();
        //disable transition
        var transitionDuration = msnry.options.transitionDuration;
        msnry.options.transitionDuration = 0;
        $ ('.tiles-grid').imagesLoaded (function () {
          msnry.layout ();
        });
        //reset transition
        msnry.options.transitionDuration = transitionDuration;
      } else {
        // init masonry
        // transition set to zero on mobile due to undesirable behaviour on mobile safari if > 0
        //debugger;
        try {
          const transDuration = base.site.mobileView //get ('site.mobileView')
            ? 0
            : settings.topic_list_tiles_transition_time;
          $ ('.tiles-grid').masonry ({
            itemSelector: '.tiles-grid-item',
            transitionDuration: `${transDuration}s`,
            percentPosition: true,
            columnWidth: '.tiles-grid-sizer',
            gutter: '.tiles-gutter-sizer',
          });
          msnry = $ ('.tiles-grid').data ('masonry');

          $ ('.tiles-grid').imagesLoaded (msnry.layout ());
        } catch (error) {
          debugger;
        }
      }

      // }
      //   // $( window ).resize( setColumns );

      //   // let msnry = $('.tiles-grid').data('masonry');

      //   //  if (msnry) {
      //   //    msnry.reloadItems();
      //   //    //disable transition
      //   //    var transitionDuration = msnry.options.transitionDuration;
      //   //    msnry.options.transitionDuration = 0;
      //   //    loadScript (
      //   //     'https://unpkg.com/imagesloaded@4/imagesloaded.pkgd.min.js'
      //   //   ).then (() => {
      //   //    // debugger;
      //   //    $('.tiles-grid').imagesLoaded(msnry.layout());
      //   //   });
      //   //    //reset transition
      //   //    msnry.options.transitionDuration = transitionDuration;
      //   //  } else {
      //   //    debugger;
      //   // init masonry
      //   // transition set to zero on mobile due to undesirable behaviour on mobile safari if > 0
      //   // const transDuration = this.get('site.mobileView') ? 0 : settings.topic_list_tiles_transition_time;
      //   $ ('.tiles-grid').masonry({
      //     itemSelector: '.tiles-grid-item',
      //     transitionDuration: 0, //`${transDuration}s`,
      //     // percentPosition: true,
      //     // columnWidth: '.tiles-grid-sizer',
      //     // gutter: '.tiles-gutter-sizer'
      //     columnWidth: ( containerWidth, gutter ) => { return ((containerWidth) / columns) - gutter },
      //     gutter: 0 // '.tiles-gutter-sizer'
      //   });

      //     var msnry = $('.tiles-grid').data('masonry');
      //     debugger;
      //     loadScript (
      //       'https://unpkg.com/imagesloaded@4/imagesloaded.pkgd.min.js'
      //     ).then (() => {
      //       $('.tiles-grid').imagesLoaded(msnry.layout());
      //     });
      // });
    });
  });
};

export {resizeAllGridItems};
