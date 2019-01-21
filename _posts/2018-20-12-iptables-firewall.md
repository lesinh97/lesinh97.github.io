---
layout: post
title:  "iptables-based custom Firewall"
date:   "2018-12-20"
excerpt: "Line of rules to rule the Internet world."
image: "/images/Firewall-and-Router-Management.png"
---

## What is Firewall?
*References from Cisco Network.*

A firewall is a network security device that monitors incoming and outgoing network traffic and decides whether to allow or block specific traffic based on a defined set of security rules.

Firewalls have been a first line of defense in network security for over 25 years. They establish a barrier between secured and controlled internal networks that can be trusted and untrusted outside networks, such as the Internet. 

A firewall can be hardware, software, or both.

## Some attack technique...

The facts that these lines of code are very simple and its just what I've learnt in university.
- IP spoofing.

```bash
$iptables -t mangle -A PREROUTING -s 224.0.0.0/3 -j DROP 
$iptables -t mangle -A PREROUTING -s 169.254.0.0/16 -j DROP 
$iptables -t mangle -A PREROUTING -s 172.16.0.0/12 -j DROP 
$iptables -t mangle -A PREROUTING -s 192.0.2.0/24 -j DROP 
$iptables -t mangle -A PREROUTING -s 192.168.0.0/16 -j DROP 
$iptables -t mangle -A PREROUTING -s 10.0.0.0/8 -j DROP 
$iptables -t mangle -A PREROUTING -s 0.0.0.0/8 -j DROP 
$iptables -t mangle -A PREROUTING -s 240.0.0.0/5 -j DROP 
$iptables -t mangle -A PREROUTING -s 127.0.0.0/8 ! -i lo -j DROP
```

We both have known about these useless address, so?
- Steath scan (TCP/SYN).

The never-closed 3 way hand-shake should be stop by scan the lonely packet in our pipeline

```bash
$iptables -A INPUT -p tcp --tcp-flags SYN,ACK SYN,ACK -m state --state NEW -j STEALTH_SCAN

$iptables -A INPUT -p tcp --tcp-flags SYN,FIN SYN,FIN         -j STEALTH_SCAN
$iptables -A INPUT -p tcp --tcp-flags SYN,RST SYN,RST         -j STEALTH_SCAN
$iptables -A INPUT -p tcp --tcp-flags ALL SYN,RST,ACK,FIN,URG -j STEALTH_SCAN

$iptables -A INPUT -p tcp --tcp-flags FIN,RST FIN,RST -j STEALTH_SCAN
$iptables -A INPUT -p tcp --tcp-flags ACK,FIN FIN     -j STEALTH_SCAN
$iptables -A INPUT -p tcp --tcp-flags ACK,PSH PSH     -j STEALTH_SCAN
$iptables -A INPUT -p tcp --tcp-flags ACK,URG URG     -j STEALTH_SCAN
```


- Ping flood (ICPM flood)

As you've known, ICMP has many types, but we will focus on 0 3 4 8 11.

```bash
OK_ICMP=&quot;0 3 4 8 11&quot;
for item in $OK_ICMP; do
$iptables -A INPUT -i $IF -s $NET -p icmp --icmp-type $item -j ACCEPT
$iptables -A OUTPUT -o $IF -s $IP -p icmp --icmp-type $item -j ACCEPT
```
But wait! The counter-ICMP flood solution is all around the Internet. So I just wanna tell you about the Half-Counter, the method that maybe useful or become an ugly depend on the condition.

The main point is, remember about what makes a flood? A ping packet! So that the size of the packet has it limit! Read carefully these codes below and use your brain :))

```bash
$iptables -A INPUT -i $IF -s $NET -p icmp --icmp-type $item -m length 42:43 -m limit --limit 1/s --limit-burst 1 -j ACCEPT
$iptables -A OUTPUT -o $IF -s $IP -p icmp --icmp-type $item -m length 42:43 -m limit --limit 1/s --limit-burst 1 -j ACCEPT
```
**Wow, magic~~!**

- HTTP DDoS

The very first attack that must be countered when design any Firewall. So the point is, you have to know about the "**Use it or lose it**" theory. In my opinion, *network administrator* must define what this Server is used for? So, give user a number of limited ticket to gain everything in your server with the defined-time. So, the solution is here. **Magiccc :)))**

Here the **s1mple** way to understand ticket


![Thing that have unlimted power](/images/http_ticket.png)

## Thing to remember

In my opinion, to create a good firewall, you firstly need to have knowledge about these attacks above. Beside, you have to keep in my the iptables cheat sheets.

### iptables common arguments

Prefixs | Features
------- | -------
-A,--append | Add one or more new rules to the specified chain
-D,--delete | Delete one or more rules from specified chain
-P, --policy| Set policy of designated chain to specified target
-N, --new-chain| Create a new user-defined chain
-X, --delete-chain | Delete specified user-defined chain
-F    | Table initialization
-p, --protocol | Specify protocol protocol (tcp, udp, icmp, all)
-s,  - source IP address [/ mask] | Source address. Describe IP address or host name
-d, - destination IP address [/ mask] | Address of the destination. Describe IP address or host name
-i , - in - interface | Specifies the interface on which the device packet comes in
-o, - out - interface | Specify the interface on which the device packet appears
-j, --jump | Specify action when matching target condition
-t, --table | Specify table table
-m state - state state | Specify condition of packet as condition
! | Invert the condition (except for ~)

## Repository

Follow my [repository](https://github.com/lesinh97/Firewall-Sem7). Feel free to create a pull request at anytime! ^_^