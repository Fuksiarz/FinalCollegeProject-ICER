export const getFontSize=(mediumProductsCountSetting, minDimension, widthDimension)=>{
    switch (mediumProductsCountSetting) {
        case 0:
            return widthDimension * 1 / 140; // przykładowy stosunek
        case 1:
            return widthDimension * 1 / 120; // dostosuj te proporcje w razie potrzeby
        case 2:
            return widthDimension * 1 / 100;
        case 3:
            return minDimension * 1 / 40;
        case 4:
            return minDimension * 1 / 30;
        default:
            return 16; // domyślny rozmiar czcionki, jeśli żaden z przypadków nie pasuje
    }
}
