# Archived ReelBook features

Features retired from the ReelBook interface. **No data has ever been deleted
for any of these.** Every table, column, component and database function is
still in place, so each one is a small change to put back.

The pattern throughout: remove the entry point (a nav tab, a button, a form
field), leave the data layer and the component alone.

---

## Retired 11 November 2026

### Favourites

Pick up to four all-time favourites shown on your profile.

- **Why:** never used. The `favorites` table had 0 rows.
- **Removed:** the Favourites card in Settings, which held your own editor and
  the strip of other household members' picks.
- **Kept:** `favorites` table, `src/components/Favorites.jsx`
  (`FavoritesEditor`, `FavoritesStrip`), and `listFavorites` in `db.js`.
- **To restore:** re-import the two components in `pages/Settings.jsx` and put
  the card back.

### Friends, Taste Match and public profile sharing

Add friends by email, compare taste with them, and share a read-only profile
page at `/p/:token`.

- **Why:** never used. `friendships` and `share_profiles` both had 0 rows.
- **Removed:** the Friends and Taste match entries in the overflow menu, the
  `/friends`, `/match` and `/p/:token` routes, and the Public profile card in
  Settings.
- **Kept:** `pages/Friends.jsx`, `pages/TasteMatch.jsx`,
  `pages/PublicProfile.jsx`, the `friendships` and `share_profiles` tables, and
  the `friend_feed`, `my_friends`, `send_friend_request`, `shares_household`
  and `public_profile` database functions.
- **Note:** "Loved by friends" on the For You page is now permanently empty
  rather than broken. It already handled having no friends.
- **To restore:** re-add the three lazy imports and routes in `main.jsx` and the
  two `MENU` entries in `components/Layout.jsx`.

### Visibility on a watch

A Private / Friends / Public selector on every logged watch.

- **Why:** all 1,510 watches were Private, and with Friends gone the other two
  options did nothing.
- **Removed:** the selector in the Mark watched modal.
- **Kept:** the `watches.visibility` column, every stored value, and the
  `can_see_watch` function that enforces it.
- **Now:** new watches are written as `private`, which is what they all were.
- **To restore:** put the `<select>` back in `components/MarkWatchedModal.jsx`
  and turn the `visibility` constant back into state.

### Tags and review notes

Free-text tags and a review box on each watch.

- **Why:** 6 of 1,510 watches had tags, 1 had a note.
- **Removed:** both fields from the Mark watched modal and the diary editor,
  and the tag filter dropdown on the Diary.
- **Kept:** the `watches.tags` and `watches.note` columns and everything in
  them. Existing notes and tags **still display** on diary entries; the tag
  chips are simply no longer clickable, because filtering went with the editor.
  The diary editor still saves both fields back unchanged.
- **To restore:** re-add the `TagInput` and textarea fields, and restore
  `tagF` to state in `pages/Diary.jsx`.

### Groups: Just Muneeza and Family

- **Why:** both completely empty. Checked against all eight tables that
  reference a group (watches, episode_watches, watchlist, group_members,
  import_batches, season_ratings, dropped_shows, show_home): zero rows in every
  one.
- **Removed:** both group rows, plus one orphaned `group_members` row.
- **Remaining groups:** Arshad & Muneeza, Just Arshad.
- **To restore:** create them again from the Groups page. Nothing was lost.

### Browse: bulk "add selected to lists"

- **Why:** it called `addToWatchlist`, so everything it saved went to the
  watchlist that is no longer shown anywhere.
- **Removed:** the button and its `BulkLists` panel in `pages/Browse.jsx`.
- **Kept:** bulk Mark watched, which works and stays.

---

## Retired earlier

### Personal star ratings (yours and Muneeza's)

- **Why:** IMDb and TMDB scores are enough.
- **Removed:** rating fields in Mark watched and the diary editor, the score
  chips on the Diary, Lists and title pages, the rate-me nudge, season rating
  stars, per-episode rating stars, the episode rating graph and the season
  score bars.
- **Kept:** all 1,152 stored scores in the `ratings` table. They still feed
  For You, Taste Match, Insights and Wrapped, which is why those pages were
  left alone.

### Watchlist and Rewatch

- **Why:** the watchlist lives on IMDb instead.
- **Removed:** the Watchlist nav tab, the Add to watchlist button on title
  pages, and the Browse bulk panel that wrote to it.
- **Kept:** 493 watchlist rows, the `/watchlist` route, and the Settings export
  still includes them.

---

## Still active

Stopped tracking (9 shows) and Ongoing (6 shows) are both in use and were not
touched.
