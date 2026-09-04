BEGIN { in_block = 0 }
/if \(\!clientPortal\) \{/ {
    in_block = 1;
    print "      if (!clientPortal) {";
    print "        showToast?.('Error: Client Portal does not exist.', 'error');";
    print "        setIsUploadingToPortal(false);";
    print "        return;";
    print "      }";
    next;
}
in_block == 1 && /^\s*\}\s*$/ {
    in_block = 0;
    next;
}
in_block == 1 { next; }
{ print $0 }
