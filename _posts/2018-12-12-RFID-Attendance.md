---
layout: post
title:  "Arduino RFID time attendance "
date:   "2018-12-12"
excerpt: "RFID, RTC module and more!"
image: "/images/time-attendance.jpg"
---

## Why?
I just wanna make a private doorlock and tracking system in my personal room. And maybe in the following time period, I can extend this project to a huge project that can be implemented in a such large places like a company's entrance door and so on.


## What we need 
    Uno R3 or whatever
    RFID RC522 module
    DS3231 RTC module
    MicroSD card module
    Jump wires
    12V DC Solenoid Doorlock
    N-Mosfet
    A big big brain

### Which problems will we faces?
Something will happen in the very first time you run this circuit. That RFID module cannot read and write anything, either microSd card module.
The reason is about a China-exported circuit, microSD module. In my point of view that this apdater is so selfish, it will take all the MISO line in your SPI bus. Whatever, you must tell this brainless circuit to settled down.

Gentlely put 270~330 Ohm resistor in the MISO line came from this apdater, everything will work fine.
Here the solution

<span style="display:block;text-align:center">![wow](/images/time-attendance-1.jpg)
### Breadboard

<span style="display:block;text-align:center">![wow](/images/rfid-rc522_bb.jpg){:height="70%" width="70%"}

### Code

Follow my [repository](https://www.google.com)

Google my work [at](https://github.com/lesinh97/Arduino-Sketch)

Have fun! ^_^


