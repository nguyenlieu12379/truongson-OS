"""Find each white plate on the wood table in dd-header.jpg: low saturation + bright = plate rim.
Prints bbox and whether the plate touches the photo edge."""
import cv2, numpy as np
from scipy import ndimage as ndi
img = cv2.imread("assets/source/dd-header.jpg"); h, w = img.shape[:2]
hsv = cv2.cvtColor(cv2.GaussianBlur(img, (0, 0), 2), cv2.COLOR_BGR2HSV)
white = (hsv[..., 1] < 38) & (hsv[..., 2] > 170)
white = ndi.binary_opening(white, iterations=2)
lab, k = ndi.label(white)
sizes = ndi.sum(white, lab, range(1, k + 1))
for i in np.argsort(-sizes)[:9]:
    if sizes[i] < 20000: continue
    m = lab == i + 1
    ys, xs = np.nonzero(m)
    print(f"comp {i+1} area {int(sizes[i])} bbox x{xs.min()}-{xs.max()} y{ys.min()}-{ys.max()} touches {[xs.min()==0, xs.max()==w-1, ys.min()==0, ys.max()==h-1]}")
