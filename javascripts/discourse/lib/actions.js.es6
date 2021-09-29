import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

var addLike = function (postId) {
  ajax("/post_actions", {
    type: "POST",
    data: {
      id: postId,
      post_action_type_id: 2,
    },
    returnXHR: true,
  }).catch(function (error) {
    popupAjaxError(error);
  });
};

var sendBookmark = function (topic_id, topic_post_id, bookmarked) {
  if (bookmarked) {
    const data = {
      reminder_type: null,
      reminder_at: null,
      name: null,
      post_id: topic_post_id,
    };
    return ajax("/bookmarks", {
      type: "POST",
      data,
    }).catch(function (error) {
      popupAjaxError(error);
    });
  } else {
    return ajax(`/t/${topic_id}/remove_bookmarks`, {
      type: "PUT",
    }).catch(function (error) {
        popupAjaxError(error);
      });
  }
};

var removeLike = function (postId) {
  ajax("/post_actions/" + postId, {
    type: "DELETE",
    data: {
      post_action_type_id: 2,
    },
  }).catch(function (error) {
    popupAjaxError(error);
  });
};

export { addLike, sendBookmark, removeLike };
