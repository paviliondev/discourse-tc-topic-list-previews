# discourse-topic-list-previews-theme
A currently EXPERIMENTAL Theme component which ports much of the functionality of the much-loved Topic List Previews plugin to a Theme Component.

As a result of various technical limitations you need to be aware of the following:

- I have no control in a Theme Component on what is serialized, so various features no longer work:
  - Thumbnail resolution discretion from settings
  - Actions (these are hidden)
  - Featured Images - I may be able to get these to work in some way soon ...
- Because of the way I've opted to render a masonry style tiles display, on Chrome there will be a limit to how far you can scroll until the arrangement messes up.  This is actually being worked on, hence why I'm using this method.
