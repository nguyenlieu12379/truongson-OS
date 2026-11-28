# Sources

All from CB Bakery's own channels, saved 2026-11-28. Son was away and said not to ask ("go on your own"), so picks were not shown first.

| File | What | Source |
|---|---|---|
| google/g8.jpg | Coxinha on a white plate (1800x2400). Hero cutout `assets/coxinha.webp` | Google Maps, CB Bakery, "By owner" photos (ids in `google/ids.txt`, fetched at `=s2400`) |
| google/g7.jpg | Plate: rice, beans, roast chicken, salad (1599x2400). `assets/plate.webp` (cut along the fitted plate ellipse) | Google, by owner |
| google/g1.jpg | The room: cases, tables, Brazil flags (1800x2400). `assets/room.webp` | Google, by owner |
| google/g4, g5, g6 | Enroladinho, cake case, cake slice. Not used | Google, by owner |
| dd-header.png | Studio spread on marble (1400x787). Steak plate cut with a hand-drawn ellipse: `assets/steak.webp` | DoorDash store header, doordash-static.s3.amazonaws.com/media/store/header/2ec82387-082d-42db-b906-d34fae0a4f29.png |
| ig-avatar.png | Their Instagram profile picture (150x150), the logo in the bar: `assets/avatar.webp` | instagram.com/cbbakery, saved 2026-11-28 |
| logo.png | Logo, maroon #6D2425, gold #DB9637. `assets/logo.webp` | DoorDash cover_square 68a3656d-bf15-49b8-bea3-2515ec3133e9 |
| ue/*.jpg | Menu photos (550px). Cut: coxinhas-box, empadinha (`empadinha`), catarina, quindim, tortinha-morango (`tortinha`), brigadeiro | Uber Eats store ubereats.com/store/cb-bakery/ySjpf22ETheXdb_7TZZYdA, tb-static.uber.com/prod/image-proc/processed_images/<id>/70aa2a4db7f990373ca9c376323e3dea.jpeg (ids in `ue/menu.txt`) |

Not used: their Instagram photos (most hold the item in a hand), customer photos on Google, the risole and mini pudim (neighbouring items or the caramel pool cut by the frame), anything with baked-in text.

Cuts: `lab/cut.py` (colour seeds + GrabCut, holes filled; plates are ellipses). Check sheets on white, black and the ground: `lab/check/`.
