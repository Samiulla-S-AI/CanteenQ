import math

def test_formulas(amount_paise):
    results = {}
    
    amount = amount_paise
    
    # f1: round(fee), round(gst on rounded fee)
    f_fee1 = round(amount * 0.02)
    f_gst1 = round(f_fee1 * 0.18)
    results['f1'] = f_fee1 + f_gst1
    
    # f2: round(fee), ceil(gst on rounded fee)
    f_fee2 = round(amount * 0.02)
    f_gst2 = math.ceil(f_fee2 * 0.18)
    results['f2'] = f_fee2 + f_gst2
    
    # f3: Math.round for both fee and gst based on exact fee?
    fee = amount * 0.02
    gst = fee * 0.18
    results['f3'] = round(fee) + round(gst)

    # f4: round(total_fee)
    results['f4'] = round(amount * 0.0236)

    # f5: ceil(total_fee)
    results['f5'] = math.ceil(amount * 0.0236)

    # f6: ceil(fee) + ceil(gst on ceil fee)
    f_fee6 = math.ceil(amount * 0.02)
    f_gst6 = math.ceil(f_fee6 * 0.18)
    results['f6'] = f_fee6 + f_gst6
    
    # f7: fee = amount * 0.02, gst = fee * 0.18. ceil both
    results['f7'] = math.ceil(fee) + math.ceil(gst)

    # f8: floor(amount * 0.02) + ceil(floor(fee)*0.18)
    results['f8'] = math.floor(amount * 0.02) + math.ceil(math.floor(amount * 0.02) * 0.18)

    return results

print('101 paise:', test_formulas(101))
print('10100 paise:', test_formulas(10100))
